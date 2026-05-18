import { NS } from '@ns';
import { log } from '../logger';
import { createBatches, doPrep, getServers, spawnWorker } from './controllerUtils';
import { Job } from '/types';
import {
    controllerScriptName,
    loggerPortNumber,
    securityDecreasePerWeakenThread,
    securityGrowthPerGrowThread,
    securityGrowthPerHackThread,
    workerRamCost,
} from '/utils/constants';
import { Metrics } from './metrics';
import { RamManager } from './ramManager';

export async function main(ns: NS) {
    // If hackController takes the logger port, restart it
    if (ns.pid === loggerPortNumber) {
        ns.run(controllerScriptName);
        ns.kill(ns.pid);
    }

    ns.disableLog('ALL');
    ns.clearLog();
    ns.ui.openTail();
    ns.ui.moveTail(1000, 0);

    try {
        await controlWorkers(ns);
    } catch (error: unknown) {
        if (error instanceof Error) {
            log(ns, error.message, 'error');
        } else {
            ns.print(error);
        }
    }
}

async function controlWorkers(ns: NS) {
    while (true) {
        ns.print('Begin sending shotgun hack.');
        ns.clearPort(ns.pid);

        ns.print('Fetching server list.');
        const servers = getServers(ns);

        // const target = getTarget(serverData);
        const target = ns.args[0] as string;

        if (target === undefined) {
            throw new Error('Missing first argument: target.');
        }

        const metrics = new Metrics(ns, target);
        const ramManager = new RamManager(ns, servers);

        if (!metrics.isPrepped) ns.print('Doing prep.');
        while (!metrics.isPrepped) {
            await doPrep(ns, target, ramManager);
            metrics.checkIsPrepped(ns);
        }

        // Calculations
        ns.print('Doing calculations for shotgun batch.');
        await optimizeShotgun(ns, metrics, ramManager);
        metrics.calculate(ns);

        ns.print('Creating jobs.');
        const jobs = createBatches(ns, metrics, ramManager);

        // Launch all jobs
        ns.print(
            `Launching ${jobs.length / 4} batches (${jobs.length} jobs) at ${metrics.target}.`
        );
        for (const job of jobs) {
            job.endTime += metrics.cumulativeDelay;
            const workerPid = spawnWorker(ns, job);
            if (!workerPid) throw new Error(`Unable to deploy ${job.action} to ${job.host}`);

            await ns.nextPortWrite(workerPid);
            metrics.cumulativeDelay += ns.readPort(workerPid);
        }

        const batchStartTime = Date.now();
        const moneyToSteal = metrics.currentMoney * metrics.greed;
        const timer = setInterval(() => {
            const now = Date.now();
            const elapsed = now - batchStartTime;
            const totalDuration = metrics.durations.weaken2 + metrics.endTime;

            const barWidth = 16;
            const filledBars = Math.floor((elapsed / totalDuration) * barWidth);
            const emptyBars = barWidth - filledBars;
            const bar = '|'.repeat(filledBars) + '-'.repeat(emptyBars);

            ns.clearLog();
            ns.print(`Sending shotgun hack at ${metrics.target}.`);
            ns.print(
                `Workers | ${metrics.numOfBatches * 4} workers are deployed, totalling ${metrics.numOfBatches} batches.`
            );
            ns.print(
                `RAM | Using ${ns.format.ram(ramManager.networkTotalRam - ramManager.totalRam)} / ${ns.format.ram(ramManager.availableRam)} on the network.`
            );
            ns.print(`Security | ${metrics.currentSecurity} / ${metrics.minimumSecurity}`);
            ns.print(
                `Money | ${ns.format.number(metrics.currentMoney)} / ${ns.format.number(metrics.maxMoney)}`
            );
            ns.print(
                `Income | ${ns.format.number(moneyToSteal)} per batch, for a total of ${ns.format.number(moneyToSteal * metrics.numOfBatches)}`
            );
            ns.print(
                `Time remaining: ${ns.format.time(elapsed)} / ${ns.format.time(totalDuration)}`
            );
            ns.print(`[${bar}]`);
        }, 1000);

        ns.atExit(() => clearInterval(timer));

        jobs.reverse();

        // Wait for jobs to finish
        ns.print('Waiting for jobs to complete.');
        do {
            await ns.nextPortWrite(ns.pid);
            ns.clearPort(ns.pid);
            ramManager.finishJob(jobs.pop() as Job);
        } while (jobs.length > 0);

        ns.print('Shotgun fired!');
        ns.clearLog();
    }
}

async function optimizeShotgun(ns: NS, metrics: Metrics, ramManager: RamManager) {
    const maxThreads = ramManager.maxAvailableRam / workerRamCost;
    const weakenTime = ns.getWeakenTime(metrics.target);

    const minGreed = 0.01;

    let greed = 0.99;
    let bestIncome = 0;
    const stepValue = 0.01;

    while (greed > minGreed) {
        const moneyToSteal = greed * metrics.maxMoney;

        const hackThreads = Math.max(
            Math.floor(ns.hackAnalyzeThreads(metrics.target, moneyToSteal)),
            1
        );
        const growThreads = Math.ceil(
            ns.growthAnalyze(metrics.target, metrics.maxMoney / (metrics.maxMoney - moneyToSteal))
        );

        // If theoretical hack or grow can fit on our biggest server
        if (Math.max(hackThreads, growThreads) <= maxThreads) {
            const weaken1Threads = Math.max(
                Math.ceil(
                    (hackThreads * securityGrowthPerHackThread) / securityDecreasePerWeakenThread
                ),
                1
            );
            const weaken2Threads = Math.max(
                Math.ceil(
                    (growThreads * securityGrowthPerGrowThread) / securityDecreasePerWeakenThread
                ),
                1
            );

            const numOfBatches = ramManager.tryAllocateBatches({
                hack: hackThreads * workerRamCost,
                weaken1: weaken1Threads * workerRamCost,
                grow: growThreads * workerRamCost,
                weaken2: weaken2Threads * workerRamCost,
            });

            const totalIncome = moneyToSteal * numOfBatches;
            const totalTime = metrics.actionBuffer * 4 * numOfBatches + weakenTime;

            const incomePerSecond = totalIncome / totalTime;

            if (incomePerSecond > bestIncome) {
                bestIncome = incomePerSecond;
                metrics.greed = greed;
                metrics.numOfBatches = numOfBatches;
            }
        }

        greed = Math.round((greed - stepValue) * 100) / 100;
    }
}

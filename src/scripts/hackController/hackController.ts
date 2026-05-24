import { NS } from '@ns';
import { log } from '../core/logger';
import { createBatches, doPrep, spawnWorker } from './controllerUtils';
import { Job } from '/types';
import {
    controllerScriptName,
    killAllScriptName,
    loggerPortNumber,
    securityDecreasePerWeakenThread,
    securityGrowthPerGrowThread,
    securityGrowthPerHackThread,
    workerRamCost,
} from '/utils/constants';
import { Metrics } from './metrics';
import { RamManager } from './ramManager';
import { getServers } from '/utils/utils';

export async function main(ns: NS) {
    ns.disableLog('ALL');
    ns.clearLog();
    ns.ui.openTail();
    ns.ui.setTailMinimized(true);
    ns.ui.moveTail(600, 0);

    // If hackController takes the logger port, restart it
    if (ns.pid === loggerPortNumber) {
        ns.atExit(() => ns.run(controllerScriptName), 'restart');
        ns.exit();
    }

    ns.atExit(() => ns.ui.closeTail(), 'ui');

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
        ns.clearPort(ns.pid);

        const servers = getServers(ns);

        // const target = getTarget(serverData);
        const target = ns.args[0] as string;

        if (target === undefined) {
            throw new Error('Missing first argument: target.');
        }

        const metrics = new Metrics(ns, target);
        const ramManager = new RamManager(ns, servers);

        while (!metrics.isPrepped) {
            await doPrep(ns, target);
            metrics.checkIsPrepped(ns);
        }

        // Calculations
        await optimizeShotgun(ns, metrics, ramManager);
        metrics.calculate(ns);

        const jobs = createBatches(ns, metrics, ramManager);

        // Launch all jobs
        for (const job of jobs) {
            job.endTime += metrics.cumulativeDelay;
            const workerPid = spawnWorker(ns, job);
            if (!workerPid) throw new Error(`Unable to deploy ${job.action} to ${job.host}`);

            await ns.nextPortWrite(workerPid);
            metrics.cumulativeDelay += ns.readPort(workerPid);
        }

        // Kill jobs if controller dies
        // TODO: Possibly replace this with a more specific "kill workers" script to avoid interfering with other network scripts
        ns.atExit(() => ns.run(killAllScriptName), 'killWorkers');

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
            ns.print(
                `Security | ${metrics.currentSecurity.toFixed(2)} / ${metrics.minimumSecurity.toFixed(2)}`
            );
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

        ns.atExit(() => clearInterval(timer), 'timer');

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

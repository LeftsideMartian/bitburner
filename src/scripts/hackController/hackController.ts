import { NS } from '@ns';
import { log } from '../logger';
import { getServers, spawnWorker } from './controllerUtils';
import { Job } from '/types';
import {
    controllerScriptName,
    loggerPortNumber,
    securityDecreasePerWeakenThread,
    securityGrowthPerGrowThread,
    securityGrowthPerHackThread,
    workerActions,
    workerRamCost,
} from '/utils/constants';
import { disableLogging } from '/utils/utils';
import { Metrics } from './metrics';
import { RamManager } from './ramManager';

let ramManager: RamManager;

export async function main(ns: NS) {
    // If hackController takes the logger port, restart it
    if (ns.pid === loggerPortNumber) {
        ns.run(controllerScriptName);
        ns.kill(ns.pid);
    }

    disableLogging(ns, [
        'getHackingLevel',
        'getServerGrowth',
        'getServerMaxMoney',
        'getServerMaxRam',
        'getServerMinSecurityLevel',
        'getServerMoneyAvailable',
        'getServerRequiredHackingLevel',
        'getServerSecurityLevel',
        'getServerUsedRam',
        'scp',
        'ui.clearTerminal',
        'scan',
    ]);

    // try {

    // } catch (error: unknown) {
    //     if (error instanceof Error) log(ns, JSON.stringify(error), 'error');
    // }

    await controlWorkers(ns);
}

async function controlWorkers(ns: NS) {
    while (true) {
        const port = ns.getPortHandle(ns.pid);
        port.clear();

        const servers = getServers(ns);

        // const target = getTarget(serverData);
        const target = 'n00dles';

        const metrics = new Metrics(ns, target);
        ramManager = new RamManager(ns, servers);

        // Do prep
        await optimizeShotgun(ns, metrics, ramManager);
        metrics.calculate(ns);

        const jobs = createBatches(ns, metrics);

        for (const job of jobs) {
            job.endTime += metrics.cumulativeDelay;
            const workerPid = spawnWorker(ns, job);
            if (!workerPid) throw new Error(`Unable to deploy ${job.action} to ${job.host}`);

            await ns.nextPortWrite(workerPid);
            metrics.cumulativeDelay += ns.readPort(workerPid);
        }

        jobs.reverse();

        do {
            await port.nextWrite();
            port.clear();
            ramManager.finishJob(jobs.pop() as Job);
        } while (jobs.length > 0);
    }
}

function createBatches(ns: NS, metrics: Metrics): Job[] {
    const jobs: Job[] = [];

    for (let i = 0; i < metrics.numOfBatches; i++) {
        workerActions.forEach(action => {
            metrics.endTime += metrics.actionBuffer;

            const job = {
                action: action,
                threads: metrics.threads[action],
                target: metrics.target,
                duration: metrics.durations[action],
                endTime: metrics.endTime,
                host: 'ToBeAssignedByRamManager',
                controllerPort: metrics.controllerPort,
                ramCost: metrics.workerRam * metrics.threads[action],
                batchNum: i,
                reportToController: true,
            };

            if (!ramManager.assignJob(job)) {
                throw new Error(`Could not assign ${action} job in network.`);
            }

            jobs.push(job);
        });
    }

    log(
        ns,
        `Queuing ${metrics.numOfBatches * workerActions.length} jobs at ${metrics.target}`,
        'info'
    );

    return jobs;
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

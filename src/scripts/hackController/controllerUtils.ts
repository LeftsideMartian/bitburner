import { NS } from '@ns';
import { scrapeNetwork } from '../spider';
import {
    argErrorFileName,
    constantsFileName,
    controllerUtilsScriptName,
    homeNode,
    loggerScriptName,
    programsFileName,
    shareScriptName,
    spiderScriptName,
    utilsFileName,
    workerRamCost,
    workerScriptName,
} from '/utils/constants';
import { getPrograms } from '/utils/programs';
import { Job } from '/types';
import { Metrics } from './metrics';
import { RamManager } from './ramManager';

export function getServers(ns: NS): string[] {
    const servers = scrapeNetwork(ns);

    return servers.filter(server => {
        const hasRootAccess = getRootAccess(ns, server);
        if (hasRootAccess) {
            deployAllScripts(ns, server);
            return true;
        }
        return false;
    });
}

export function deployAllScripts(ns: NS, server: string) {
    const fileNames = [
        loggerScriptName,
        workerScriptName,
        constantsFileName,
        programsFileName,
        utilsFileName,
        argErrorFileName,
        spiderScriptName,
        controllerUtilsScriptName,
        shareScriptName,
    ];

    fileNames.forEach(file => {
        if (ns.fileExists(file)) {
            ns.rm(file, server);
        }

        ns.scp(file, server);
    });
}

function getRootAccess(ns: NS, node: string): boolean {
    if (ns.hasRootAccess(node)) {
        return true;
    }

    const isHackingLevelHighEnough = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(node);

    if (!isHackingLevelHighEnough) {
        return false;
    }

    let ports = 0;

    // Attempt to run all programs
    Object.entries(getPrograms(ns)).forEach(([fileName, program]) => {
        if (ns.fileExists(fileName, homeNode)) {
            program.nsFunc(node);
            ports++;
        }
    });

    const areEnoughPortsOpen = ports >= ns.getServerNumPortsRequired(node);

    // Ensure all hackable servers have root access
    if (areEnoughPortsOpen) {
        return ns.nuke(node);
    } else {
        return false;
    }
}

export async function doPrep(ns: NS, target: string, ramManager: RamManager) {
    getServers(ns);
    ns.clearPort(ns.pid);

    const metrics = new Metrics(ns, target);

    // Calculations
    metrics.calculate(ns);

    const growPercentage = !metrics.getIsSecurityPrepped(ns) ? 0.3 : 0.6;
    if (!metrics.getIsSecurityPrepped(ns) || !metrics.getIsMoneyPrepped(ns)) {
        const totalThreads = ramManager.availablePrepThreads;
        const maxThreadsPerJob = Math.floor(ramManager.maxAvailableRam / workerRamCost);
        let bestNumBatches = 1;
        const initialGrow = Math.floor(totalThreads * growPercentage);
        const initialWeaken = totalThreads - initialGrow;
        let bestGrowPerBatch = Math.min(initialGrow, maxThreadsPerJob);
        let bestWeakenPerBatch = Math.min(initialWeaken, maxThreadsPerJob);

        // Try increasing number of batches to maximize utilization
        for (let numBatches = 1; numBatches <= 100; numBatches++) {
            const growPerBatch = Math.floor((totalThreads * growPercentage) / numBatches);
            const weakenPerBatch = Math.floor((totalThreads * (1 - growPercentage)) / numBatches);

            // Skip if batch is too small or individual jobs exceed server capacity
            if (
                growPerBatch === 0 ||
                weakenPerBatch === 0 ||
                growPerBatch > maxThreadsPerJob ||
                weakenPerBatch > maxThreadsPerJob
            )
                break;

            // Check if this batch configuration fits in the network
            const fittingBatches = ramManager.tryAllocateBatches({
                hack: 0,
                weaken1: 0,
                grow: growPerBatch * workerRamCost,
                weaken2: weakenPerBatch * workerRamCost,
            });

            if (fittingBatches >= numBatches) {
                bestNumBatches = numBatches;
                bestGrowPerBatch = growPerBatch;
                bestWeakenPerBatch = weakenPerBatch;
            }
        }

        metrics.threads = {
            hack: 0,
            weaken1: 0,
            grow: bestGrowPerBatch,
            weaken2: bestWeakenPerBatch,
        };
        metrics.numOfBatches = bestNumBatches;
    } else {
        return;
    }

    metrics.actions = ['grow', 'weaken2'];

    const jobs = createBatches(ns, metrics, ramManager);

    // Launch all jobs
    for (const job of jobs) {
        job.endTime += metrics.cumulativeDelay;
        const workerPid = spawnWorker(ns, job);
        if (!workerPid) throw new Error(`Unable to deploy ${job.action} to ${job.host}`);

        await ns.nextPortWrite(workerPid);
        metrics.cumulativeDelay += ns.readPort(workerPid);
    }

    const prepStartTime = Date.now();
    const timer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - prepStartTime;
        const totalDuration = metrics.durations.weaken2 + metrics.endTime;

        const barWidth = 16;
        const filledBars = Math.floor((elapsed / totalDuration) * barWidth);
        const emptyBars = barWidth - filledBars;
        const bar = '|'.repeat(filledBars) + '-'.repeat(emptyBars);

        ns.clearLog();
        ns.print(`Doing prep on ${metrics.target}.`);
        ns.print(`Security | ${metrics.currentSecurity} / ${metrics.minimumSecurity}`);
        ns.print(
            `Money | ${ns.format.number(metrics.currentMoney)} / ${ns.format.number(metrics.maxMoney)}`
        );
        ns.print(`Time remaining: ${ns.format.time(elapsed)} / ${ns.format.time(totalDuration)}`);
        ns.print(`[${bar}]`);
    }, 1000);

    ns.atExit(() => clearInterval(timer));

    jobs.reverse();

    // Wait for jobs to finish
    do {
        await ns.nextPortWrite(ns.pid);
        ns.clearPort(ns.pid);
        ramManager.finishJob(jobs.pop() as Job);
    } while (jobs.length > 0);

    clearInterval(timer);
    ns.clearLog();
}

export function createBatches(ns: NS, metrics: Metrics, ramManager: RamManager): Job[] {
    const jobs: Job[] = [];

    for (let i = 0; i < metrics.numOfBatches; i++) {
        metrics.actions.forEach(action => {
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
                throw new Error(`Could not assign ${action} job in network. Ram: ${job.ramCost}.`);
            }

            jobs.push(job);
        });
    }

    return jobs;
}

export const spawnWorker = (ns: NS, job: Job): number =>
    ns.exec(workerScriptName, job.host, job.threads, JSON.stringify(job));

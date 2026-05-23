import { NS } from '@ns';
import { workerRamCost, workerScriptName } from '/utils/constants';
import { Job } from '/types';
import { Metrics } from './metrics';
import { RamManager } from './ramManager';
import { getServers } from '/utils/utils';

export async function doPrep(ns: NS, target: string) {
    const servers = getServers(ns);
    ns.clearPort(ns.pid);

    const ramManager = new RamManager(ns, servers);
    const metrics = new Metrics(ns, target);
    metrics.calculate(ns);

    if (metrics.isPrepped) {
        return;
    }

    const growPercentage = !metrics.getIsSecurityPrepped(ns) ? 0.3 : 0.6;

    // Allocate variable-sized jobs across servers to maximize utilization
    const jobs: Job[] = [];
    let endTime = 0;
    let batchNum = 0;

    // For each server, create jobs that fit its capacity
    for (const server of ramManager.servers) {
        const maxThreadsForServer = Math.floor(server.availableRam / workerRamCost);

        if (maxThreadsForServer < 1) continue; // Skip if server too small

        // Calculate thread split for this server
        const growThreads = Math.floor(maxThreadsForServer * growPercentage);
        const weakenThreads = Math.floor(maxThreadsForServer * (1 - growPercentage));

        if (growThreads < 1 || weakenThreads < 1) continue; // Skip if split results in 0 threads

        endTime += metrics.actionBuffer;

        // Create grow job for this server
        const growJob: Job = {
            action: 'grow',
            threads: growThreads,
            target: target,
            duration: metrics.durations.grow,
            endTime: endTime,
            host: server.hostName,
            controllerPort: metrics.controllerPort,
            ramCost: growThreads * workerRamCost,
            batchNum: batchNum,
            reportToController: true,
        };

        endTime += metrics.actionBuffer;

        // Create weaken job for this server
        const weakenJob: Job = {
            action: 'weaken2',
            threads: weakenThreads,
            target: target,
            duration: metrics.durations.weaken2,
            endTime: endTime,
            host: server.hostName,
            controllerPort: metrics.controllerPort,
            ramCost: weakenThreads * workerRamCost,
            batchNum: batchNum,
            reportToController: true,
        };

        jobs.push(growJob);
        jobs.push(weakenJob);
        batchNum++;
    }

    if (jobs.length === 0) return; // No jobs to allocate

    // Launch all jobs
    for (const job of jobs) {
        const workerPid = spawnWorker(ns, job);
        if (!workerPid) throw new Error(`Unable to deploy ${job.action} to ${job.host}`);

        await ns.nextPortWrite(workerPid);
        ns.readPort(workerPid);
    }

    const prepStartTime = Date.now();
    const maxDuration = Math.max(...jobs.map(j => j.endTime)) + metrics.durations.weaken2;

    const timer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - prepStartTime;

        const barWidth = 16;
        const filledBars = Math.floor((elapsed / maxDuration) * barWidth);
        const emptyBars = barWidth - filledBars;
        const bar = '|'.repeat(filledBars) + '-'.repeat(emptyBars);

        ns.clearLog();
        ns.print(`Doing prep on ${target}.`);
        ns.print(
            `Security | ${ns.getServerSecurityLevel(target).toFixed(2)} / ${ns.getServerMinSecurityLevel(target).toFixed(2)}`
        );
        ns.print(
            `Money | ${ns.format.number(ns.getServerMoneyAvailable(target))} / ${ns.format.number(ns.getServerMaxMoney(target))}`
        );
        ns.print(`Time remaining: ${ns.format.time(elapsed)} / ${ns.format.time(maxDuration)}`);
        ns.print(`[${bar}]`);
    }, 1000);

    ns.atExit(() => clearInterval(timer));

    jobs.reverse();

    // Wait for jobs to finish
    do {
        await ns.nextPortWrite(ns.pid);
        ns.clearPort(ns.pid);
        jobs.pop();
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

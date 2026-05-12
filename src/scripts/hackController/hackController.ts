import { NS } from '@ns';
import { log } from '../logger';
import { deployAllScripts, getServers } from './controllerUtils';
import { Job } from '/types';
import { workerActions, workerScriptName } from '/utils/constants';
import { disableLogging } from '/utils/utils';
import { Metrics } from './metrics';
import { RamManager } from './ramManager';

const greed = 0.05; // % of money to steal per hack
let ramManager: RamManager;

export async function main(ns: NS) {
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

    try {
        await controlWorkers(ns);
    } catch (error: unknown) {
        if (error instanceof Error) log(ns, error.message, 'error');
    }
}

async function controlWorkers(ns: NS) {
    const servers = getServers(ns);

    // const target = getTarget(serverData);
    const target = 'n00dles';

    const metrics = new Metrics(ns, target);
    ramManager = new RamManager(ns, servers);

    // Do prep

    while (true) {
        metrics.calculate(ns, greed);

        const jobs = createBatch(ns, metrics);

        for (const job of jobs) {
            job.endTime += metrics.cumulativeDelay;
            const workerPid = spawnWorker(ns, job);
            if (!workerPid) throw new Error(`Unable to deploy ${job.action}`);

            await ns.nextPortWrite(workerPid);
            metrics.cumulativeDelay += ns.readPort(workerPid);
        }

        await ns.nextPortWrite(ns.pid);
        ns.clearPort(ns.pid);
    }
}

function createBatch(ns: NS, metrics: Metrics): Job[] {
    const jobs: Job[] = [];

    log(
        ns,
        `Launching a batch to target ${metrics.target}\n
        Total duration: ${ns.format.time(metrics.durations.weaken2)}
        Income: $${ns.format.number(metrics.greed * metrics.maxMoney)}
        `,
        'info'
    );

    workerActions.forEach(action => {
        const job = {
            action: action,
            threads: metrics.threads[action],
            target: metrics.target,
            duration: metrics.durations[action],
            endTime:
                Date.now() +
                metrics.durations.weaken1 +
                metrics.actionBuffer * workerActions.indexOf(action),
            host: 'iron-gym',
            controllerPort: metrics.controllerPort,
            ramCost: metrics.workerRam * metrics.threads[action],
            batchNum: 1,
            reportToController: action === 'weaken2',
        };

        if (!ramManager.assignJob(job)) {
            throw new Error(`Could not assign ${action} job in network.`);
        }

        jobs.push(job);
    });

    return jobs;
}

const spawnWorker = (ns: NS, job: Job): number =>
    ns.exec(workerScriptName, job.host, job.threads, JSON.stringify(job));

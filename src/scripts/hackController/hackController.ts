import { NS } from '@ns';
import { workerScriptName } from '/utils/constants';
import { log } from '../logger';
import { deployAllScripts, disableLogging, getServers, prep } from '../../utils/utils';
import {
    WorkerAction,
    Batch,
    ServerData,
    BatchTimes,
    Job,
    BatchThreads,
    BatchDelays,
} from '/types';

const workerActions: WorkerAction[] = ['hack', 'weaken1', 'grow', 'weaken2'];
const greed = 0.1; // % of money to steal per hack
const buffer = 50; // In ms

export async function main(ns: NS) {
    disableLogging(ns, ['ui.clearTerminal']);

    try {
        await controlWorkers(ns);
    } catch (error: unknown) {
        if (error instanceof Error) log(ns, error.message, 'error');
    }
}

async function controlWorkers(ns: NS) {
    const serverData = getServers(ns);

    // Ensure scripts are everywhere
    deployAllScripts(ns, serverData);

    // const target = getTarget(serverData);
    let target = serverData['n00dles'];

    target = await prep(ns, target);

    const batch: Batch = {
        target: target,
        delays: calculateDelays(ns, target),
        threads: calculateThreads(ns, target),
        times: calculateTimes(ns, target),
        jobs: [],
    };

    log(
        ns,
        `Launching a batch to target ${batch.target.hostName}\n
        Total duration: ${ns.format.time(batch.delays.weaken2 + batch.times.weaken2)}
        Income: ${greed * target.maxMoney}
        `,
        'info'
    );

    workerActions.forEach(action =>
        batch.jobs.push({
            action: action,
            delay: batch.delays[action],
            host: 'iron-gym',
            target: batch.target.hostName,
            threads: batch.threads[action],
        })
    );

    batch.jobs.forEach(job => {
        spawnWorker(ns, job);
    });

    log(ns, `Launched batch successfully!`, 'success');
}

function calculateDelays(ns: NS, target: ServerData): BatchDelays {
    const weakenTime = ns.getWeakenTime(target.hostName);
    const hackTime = ns.getHackTime(target.hostName);
    const growTime = ns.getGrowTime(target.hostName);

    return {
        hack: weakenTime - buffer - hackTime,
        weaken1: 0,
        grow: weakenTime + buffer - growTime,
        weaken2: buffer * 2,
    };
}

function calculateThreads(ns: NS, target: ServerData): BatchThreads {
    const securityGrowthPerHackThread = 0.002;
    const securityGrowthPerGrowThread = 0.004;
    const securityDecreasePerWeakenThread = 0.05;

    const moneyToSteal = greed * target.maxMoney;

    const hackThreads = Math.max(
        Math.floor(ns.hackAnalyzeThreads(target.hostName, moneyToSteal)),
        1
    );

    const growThreads = Math.max(
        Math.floor(
            ns.growthAnalyze(target.hostName, target.maxMoney / (target.maxMoney - moneyToSteal))
        ),
        1
    );

    const weaken1Threads = Math.max(
        Math.floor((hackThreads * securityGrowthPerHackThread) / securityDecreasePerWeakenThread),
        1
    );
    const weaken2Threads = Math.max(
        Math.floor((growThreads * securityGrowthPerHackThread) / securityGrowthPerGrowThread),
        1
    );

    return {
        hack: hackThreads,
        weaken1: weaken1Threads,
        grow: growThreads,
        weaken2: weaken2Threads,
    };
}

function calculateTimes(ns: NS, target: ServerData): BatchTimes {
    const weakenTime = ns.getWeakenTime(target.hostName);

    return {
        hack: ns.getHackTime(target.hostName),
        weaken1: weakenTime,
        grow: ns.getGrowTime(target.hostName),
        weaken2: weakenTime,
    };
}

const spawnWorker = (ns: NS, job: Job) =>
    ns.exec(workerScriptName, job.host, job.threads, JSON.stringify(job));

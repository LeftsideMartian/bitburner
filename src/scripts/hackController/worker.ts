import { NS } from '@ns';
import { ArgError } from '../../errors/argError';
import { log } from '../logger';
import { Job } from '/types';

export async function main(ns: NS) {
    // Args
    const job: Job = JSON.parse(ns.args[0] as string);

    try {
        await doWork(ns, job);
    } catch (error: unknown) {
        if (error instanceof ArgError) {
            log(ns, error.message, 'error');
        } else {
            log(ns, `Unexpected error in worker.js. Hostname: ${job.host}.`, 'fatal');
        }
    }
}

async function doWork(ns: NS, job: Job) {
    let delay = job.endTime - job.duration - Date.now();

    if (delay < 0) {
        ns.writePort(ns.pid, -delay);
        delay = 0;
    } else {
        ns.writePort(ns.pid, 0);
    }

    switch (job.action) {
        case 'grow':
            await ns.grow(job.target, { additionalMsec: delay });
            break;
        case 'weaken1':
        case 'weaken2':
            await ns.weaken(job.target, { additionalMsec: delay });
            break;
        case 'hack':
            await ns.hack(job.target, { additionalMsec: delay });
            break;
        default:
            throw new ArgError(`Unexpected worker action. Received ${job.action}`);
    }

    ns.atExit(() => {
        if (job.reportToController) ns.writePort(job.controllerPort, job.action + job.host);
    });
}

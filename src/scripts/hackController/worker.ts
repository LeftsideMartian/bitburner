import { NS } from '@ns';
import { ArgError } from '../../errors/argError';
import { log } from '../logger';
import { Job } from '/types';

export async function main(ns: NS) {
    try {
        await doWork(ns);
    } catch (error: unknown) {
        if (error instanceof ArgError) {
            log(ns, error.message, 'error');
        } else {
            log(
                ns,
                `Unexpected error in worker.js. Hostname: ${ns.getHostname()}, Script: ${ns.getScriptName()}`,
                'fatal'
            );
        }
    }
}

async function doWork(ns: NS) {
    // Args
    const job: Job = JSON.parse(ns.args[0] as string);

    switch (job.action) {
        case 'grow':
            await ns.grow(job.target, { additionalMsec: job.delay });
            break;
        case 'weaken1':
        case 'weaken2':
            await ns.weaken(job.target, { additionalMsec: job.delay });
            break;
        case 'hack':
            await ns.hack(job.target, { additionalMsec: job.delay });
            break;
        default:
            throw new ArgError(`Unexpected worker action. Received ${job.action}`);
    }
}

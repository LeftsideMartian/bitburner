import { NS } from '@ns';
import { ArgError } from '../../errors/argError';
import { log } from '../logger';

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
    const target = ns.args[0].toString();

    const workerAction = getWorkerAction(ns);

    switch (workerAction) {
        case 'g':
            await ns.grow(target);
            break;
        case 'w':
            await ns.weaken(target);
            break;
        case 'h':
            await ns.hack(target);
            break;
        case '_':
            throw new ArgError('Unexpected _ worker action. Did not expect to reach this code.');
    }
}

// function getControllerPort(ns: NS) {
//     const controllerPID = Number(ns.args[2].toString());

//     if (isNaN(controllerPID)) {
//         throw new ArgError('Invalid controller PID argument passed to worker.');
//     } else {
//         return ns.getPortHandle(controllerPID);
//     }
// }

function getWorkerAction(ns: NS): WorkerAction {
    const workerAction = ns.args[1] as WorkerAction;

    if (workerAction === '_') {
        throw new ArgError('Invalid worker action as arg.');
    }

    return workerAction;
}

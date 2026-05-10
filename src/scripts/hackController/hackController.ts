import { NS, Server } from '@ns';
import { workerScriptName } from '/utils/constants';
import { deployAllScripts } from '../scriptDeploy';
import { log } from '../logger';

export async function main(ns: NS) {
    try {
        await controlWorkers(ns);
    } catch (error: unknown) {
        if (error instanceof Error) log(ns, error.message, 'error');
    }
}

async function controlWorkers(ns: NS) {
    deployAllScripts(ns);

    // Spawn instance of worker on iron-gyms
    const host = ns.getServer('iron-gym') as Server;
    const target = ns.getServer('n00dles') as Server;

    const workerAction: WorkerAction = 'h';

    spawnWorker(ns, host, target, 1, workerAction);
}

const spawnWorker = (
    ns: NS,
    host: Server,
    target: Server,
    threads: number,
    workerAction: WorkerAction
) => ns.exec(workerScriptName, host.hostname, threads, target.hostname, workerAction);

/* 
if (!ns.fileExists(scriptName, server)) {
            ns.scp(scriptName, server);
        }

        const availableServerRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        const scriptRam = ns.getScriptRam(scriptName);

        const numOfThreads = Math.floor(availableServerRam / scriptRam);

        if (availableServerRam >= scriptRam && !ns.scriptRunning(scriptName, server)) {
            ns.exec(scriptName, server, numOfThreads);
        }
*/

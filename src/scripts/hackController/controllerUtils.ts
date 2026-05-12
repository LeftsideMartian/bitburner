import { NS } from '@ns';
import { scrapeNetwork } from '../spider';
import {
    argErrorFileName,
    constantsFileName,
    controllerUtilsScriptName,
    homeNode,
    loggerScriptName,
    programsFileName,
    spiderScriptName,
    utilsFileName,
    workerScriptName,
} from '/utils/constants';
import { getPrograms } from '/utils/programs';
import { Job } from '/types';

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
    Object.values(getPrograms(ns)).forEach(program => {
        if (ns.fileExists(program.exe, homeNode)) {
            program.nsFunc(node);
            ports++;
        }
    });

    const areEnoughPortsOpen = ports >= ns.getServerNumPortsRequired(node);

    // Ensure all hackable servers have root access
    if (areEnoughPortsOpen) {
        return ns.nuke();
    } else {
        return false;
    }
}

// export async function prep(ns: NS, server: string): Promise<ServerData> {
//     log(ns, `Doing prep on ${server.hostName}.`, 'info');

//     while (true) {
//         if (server.currentMoney < server.maxMoney) {
//             log(ns, `Growing ${server.hostName}.`, 'info');
//             await ns.grow(server.hostName);
//             log(ns, `Target grew.`, 'info');
//         } else if (server.currentSecurityLevel > server.minSecurityLevel) {
//             log(ns, `Weakening ${server.hostName}.`, 'info');
//             await ns.weaken(server.hostName);
//             log(ns, `Target weakened.`, 'info');
//         } else {
//             log(ns, `Target is prepped!`, 'success');
//             break;
//         }

//         server.currentMoney = ns.getServerMoneyAvailable(server.hostName);
//         server.currentSecurityLevel = ns.getServerSecurityLevel(server.hostName);

//         await ns.sleep(100);
//     }

//     return getServerData(ns, server.hostName);
// }

const isSecurityPrepped = (ns: NS, target: string) =>
    ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target);
const isMoneyPrepped = (ns: NS, target: string) =>
    ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target);

export const spawnWorker = (ns: NS, job: Job): number =>
    ns.exec(workerScriptName, job.host, job.threads, JSON.stringify(job));

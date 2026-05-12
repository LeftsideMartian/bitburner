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

const isSecurityPrepped = (ns: NS, target: string) =>
    ns.getServerSecurityLevel(target) <= ns.getServerMinSecurityLevel(target);
const isMoneyPrepped = (ns: NS, target: string) =>
    ns.getServerMoneyAvailable(target) <= ns.getServerMaxMoney(target);

export const isPrepped = (ns: NS, target: string) =>
    isSecurityPrepped(ns, target) && isMoneyPrepped(ns, target);
export const spawnWorker = (ns: NS, job: Job): number =>
    ns.exec(workerScriptName, job.host, job.threads, JSON.stringify(job));

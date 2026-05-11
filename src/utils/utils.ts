import { NS } from '@ns';
import { scrapeNetwork } from '../scripts/spider';
import {
    argErrorFileName,
    constantsFileName,
    homeNode,
    loggerScriptName,
    programsFileName,
    spiderScriptName,
    utilsFileName,
    workerScriptName,
} from './constants';
import { getPrograms } from './programs';
import { ServerDataCollection, ServerData, NSMethods } from '../types';

export function getServers(ns: NS): ServerDataCollection {
    const servers = scrapeNetwork(ns);

    const serverDataCollection: ServerDataCollection = {};
    servers.forEach(server => {
        getRootAccess(ns, server);
        serverDataCollection[server] = getServerData(ns, server);
    });

    return serverDataCollection;
}

export function deployAllScripts(ns: NS, serverData: ServerDataCollection) {
    const fileNames = [
        loggerScriptName,
        workerScriptName,
        constantsFileName,
        programsFileName,
        utilsFileName,
        argErrorFileName,
        spiderScriptName,
    ];

    Object.values(serverData).forEach(server => {
        fileNames.forEach(file => {
            if (ns.fileExists(file)) {
                ns.rm(file, server.hostName);
            }

            ns.scp(file, server.hostName);
        });
    });
}

export function getRootAccess(ns: NS, node: string) {
    if (ns.hasRootAccess(node)) {
        return;
    }

    const isHackingLevelHighEnough = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(node);

    if (!isHackingLevelHighEnough) {
        return;
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
        ns.nuke();
    }
}

function getTargetScore(ns: NS, server: string) {
    const isHackingLevelHighEnough =
        ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server);

    if (!isHackingLevelHighEnough) {
        return 0;
    }

    return ns.getServerMaxMoney(server) / ns.getServerMinSecurityLevel(server);
}

export async function prep(ns: NS, server: ServerData): Promise<ServerData> {
    const targetSecurity = ns.getServerMinSecurityLevel(server.hostName);
    const targetMoney = ns.getServerMaxMoney(server.hostName);

    while (true) {
        if (ns.getServerMaxMoney(server.hostName) < targetMoney) {
            await ns.grow(server.hostName);
        } else if (ns.getServerSecurityLevel(server.hostName) > targetSecurity) {
            await ns.weaken(server.hostName);
        } else {
            break;
        }

        await ns.sleep(10);
    }

    return getServerData(ns, server.hostName);
}

export const getServerData = (ns: NS, server: string): ServerData => ({
    hostName: server,
    totalRam: ns.getServerMaxRam(server),
    usedRam: ns.getServerUsedRam(server),
    hasRootAccess: ns.hasRootAccess(server),
    currentSecurityLevel: ns.getServerSecurityLevel(server),
    minSecurityLevel: ns.getServerMinSecurityLevel(server),
    currentMoney: ns.getServerMoneyAvailable(server),
    maxMoney: ns.getServerMaxMoney(server),
    serverGrowth: ns.getServerGrowth(server),
    targetScore: getTargetScore(ns, server),
    isPrepped: false,
    hackChance: ns.hackAnalyzeChance(server),
});

export const getTarget = (serverData: ServerDataCollection) =>
    Object.values(serverData).sort(
        (serverAStats, serverBStats) => serverBStats.targetScore - serverAStats.targetScore
    )[0];

const isSecurityPrepped = (ns: NS, target: ServerData) =>
    ns.getServerSecurityLevel(target.hostName) < ns.getServerMinSecurityLevel(target.hostName);
const isMoneyPrepped = (ns: NS, target: ServerData) =>
    ns.getServerMoneyAvailable(target.hostName) < ns.getServerMaxMoney(target.hostName);

export const disableLogging = (ns: NS, nsMethods: NSMethods[]) =>
    nsMethods.forEach(method => ns.disableLog(method));

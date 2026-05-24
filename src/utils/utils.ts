import { NS } from '@ns';
import { ScriptConfig } from '../types';
import {
    argErrorFileName,
    configFileName,
    constantsFileName,
    controllerUtilsScriptName,
    homeNode,
    loggerScriptName,
    shareScriptName,
    utilsFileName,
    workerScriptName,
} from './constants';
import { getPrograms } from './programs';
import { scrapeNetwork } from '/scripts/core/spider';

export function getServers(ns: NS): string[] {
    const servers = scrapeNetwork(ns).filter(server => server !== homeNode);

    return servers.filter(server => {
        const hasRootAccess = getRootAccess(ns, server);
        if (hasRootAccess) {
            deployAllScripts(ns, server);
            return true;
        }
        return false;
    });
}

function deployAllScripts(ns: NS, server: string) {
    const fileNames = [
        workerScriptName,
        constantsFileName,
        utilsFileName,
        loggerScriptName,
        argErrorFileName,
        controllerUtilsScriptName,
        shareScriptName,
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
    Object.entries(getPrograms(ns)).forEach(([fileName, program]) => {
        if (ns.fileExists(fileName, homeNode)) {
            program.nsFunc(node);
            ports++;
        }
    });

    const areEnoughPortsOpen = ports >= ns.getServerNumPortsRequired(node);

    // Ensure all hackable servers have root access
    if (areEnoughPortsOpen) {
        return ns.nuke(node);
    } else {
        return false;
    }
}

export function arrayEquals(a: ScriptConfig[], b: ScriptConfig[]): boolean {
    return (
        a.length === b.length &&
        a.every((val, idx) => JSON.stringify(val) === JSON.stringify(b[idx]))
    );
}

export const writeConfigFile = (ns: NS, scriptConfigs: ScriptConfig[]) =>
    ns.write(configFileName, JSON.stringify(scriptConfigs, null, '\t'), 'w');

export const readControlCentreConfig = (ns: NS): ScriptConfig[] =>
    JSON.parse(ns.read(configFileName));

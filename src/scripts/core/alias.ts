import { NS } from '@ns';
import {
    loggerScriptName,
    controllerScriptName,
    findServerScriptName,
    purchaseServerScriptName,
    hacknetScriptName,
    shareNetworkScriptName,
    xpJoesGunsScriptName,
    killAllScriptName,
    allServersScriptName,
    controlCentreScriptName,
    gangScriptName,
} from '/utils/constants';
import { Aliases } from '/types';

export async function main(ns: NS) {
    const aliases: Aliases = {
        log: {
            script: loggerScriptName,
        },
        hc: {
            script: controllerScriptName,
        },
        find: {
            script: findServerScriptName,
        },
        pserv: {
            script: purchaseServerScriptName,
        },
        hn: {
            script: hacknetScriptName,
        },
        share: {
            script: shareNetworkScriptName,
        },
        xp: {
            script: xpJoesGunsScriptName,
        },
        ka: {
            script: killAllScriptName,
            prefix: 'killall',
        },
        allServ: {
            script: allServersScriptName,
        },
        cc: {
            script: controlCentreScriptName,
        },
        csec: {
            script: findServerScriptName,
            args: ['CSEC'],
        },
        nitesec: {
            script: findServerScriptName,
            args: ['avmnite-02h'],
        },
        bhand: {
            script: findServerScriptName,
            args: ['I.I.I.I'],
        },
        bitrun: {
            script: findServerScriptName,
            args: ['run4theh111z'],
        },
        gang: {
            script: gangScriptName,
        },
    };

    let command = '\n\n';

    for (const [alias, config] of Object.entries(aliases)) {
        command += `unalias ${alias}; alias ${alias}="${config.prefix !== undefined ? `${config.prefix}; ` : ''}run ${config.script}${config.args !== undefined ? (config.args.length > 0 ? ` ${config.args}` : '') : ''}${config.suffix !== undefined ? `; ${config.suffix}` : ''}"; `;
    }

    ns.tprint(command);
}

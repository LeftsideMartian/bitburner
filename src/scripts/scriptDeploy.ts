import { NS } from '@ns';
import {
    loggerScriptName,
    workerScriptName,
    argErrorFileName,
    utilsFileName,
    programsFileName,
    constantsFileName,
} from '/utils/constants';
import { getExternalServersList } from '/utils/utils';

export async function main(ns: NS) {
    deployAllScripts(ns);
}

export function deployAllScripts(ns: NS) {
    const servers: string[] = getExternalServersList(ns);

    const fileNames = [
        loggerScriptName,
        workerScriptName,
        constantsFileName,
        programsFileName,
        utilsFileName,
        argErrorFileName,
    ];

    servers.forEach(server => {
        fileNames.forEach(file => {
            if (ns.fileExists(file)) {
                ns.rm(file, server);
            }

            ns.scp(file, server);
        });
    });
}

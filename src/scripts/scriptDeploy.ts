import { NS } from '@ns';
import { getExternalServersList } from '../utils/utils';
import { updateServersFile } from './spider';

export async function main(ns: NS) {
    const scriptName = 'earlyHack.js';

    updateServersFile(ns);
    const servers: string[] = getExternalServersList(ns);

    ns.tprint(`Deploying to the following servers: ${servers.join(', ')}`);

    servers.forEach(server => {
        if (!ns.fileExists(scriptName, server)) {
            ns.scp(scriptName, server);
        }

        while (
            ns.getServerMaxRam(server) - ns.getServerUsedRam(server) >=
            ns.getScriptRam(scriptName)
        ) {
            ns.exec(scriptName, server);
        }
    });
}

import { NS } from '@ns';
import { updateServersFile } from './spider';

export async function main(ns: NS) {
    const scriptName = 'scripts/earlyHack.js';

    const servers: string[] = updateServersFile(ns);

    ns.tprint(`Deploying to the following servers: ${servers.join(', ')}`);

    servers.forEach(server => {
        if (!ns.fileExists(scriptName, server)) {
            ns.scp(scriptName, server);
        }

        const availableServerRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        const scriptRam = ns.getScriptRam(scriptName);

        const numOfScripts = Math.floor(availableServerRam / scriptRam);

        if (availableServerRam >= scriptRam && !ns.scriptRunning(scriptName, server)) {
            for (let i = 0; i < numOfScripts; i++) {
                ns.exec(scriptName, server);
            }
        }
    });
}

import { NS, ScriptArg } from '@ns';
import { hacknetScriptName, homeNode, spiderScriptName } from '../utils/constants';
import { disableLogging } from '../utils/utils';

interface ScriptConfig {
    scriptName: string;
    args?: ScriptArg[];
}

export async function main(ns: NS) {
    disableLogging(ns, ['getServerMaxRam', 'getServerUsedRam']);

    const sleepDuration = 5000; // in MS

    const scripts: ScriptConfig[] = [
        {
            scriptName: hacknetScriptName,
        },
        {
            scriptName: spiderScriptName,
            args: ['loop'],
        },
    ];

    while (true) {
        scripts.forEach(script => {
            const serverAvailableRam = ns.getServerMaxRam(homeNode) - ns.getServerUsedRam(homeNode);
            const scriptRam = ns.getScriptRam(script.scriptName);

            if (ns.scriptRunning(script.scriptName)) {
                ns.print(`${script.scriptName} is already running on home server.`);
                return;
            }

            const canRunScript = serverAvailableRam >= scriptRam;

            if (!canRunScript) {
                ns.print(
                    `${script} RAM is too high for current server RAM. Available RAM is ${serverAvailableRam}, but script requires ${scriptRam}.`
                );
                return;
            }

            ns.run(script.scriptName, 1, ...(script.args || []));
        });

        await ns.sleep(sleepDuration);
    }
}

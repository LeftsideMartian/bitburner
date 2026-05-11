import { NS, ScriptArg } from '@ns';
import {
    colors,
    hacknetScriptName,
    homeNode,
    loggerScriptName,
    spiderScriptName,
} from '../utils/constants';
import { disableLogging } from '../utils/utils';

interface ScriptConfig {
    scriptName: string;
    args?: ScriptArg[];
    enabled: boolean;
}

export async function main(ns: NS) {
    try {
        await controlCentre(ns);
    } catch (error: unknown) {
        if (error instanceof Error)
            ns.printf(`${colors.red}Error in control centre: ${error.message}`);
    }
}

async function controlCentre(ns: NS) {
    disableLogging(ns, ['getServerMaxRam', 'getServerUsedRam']);

    const sleepDuration = 1000; // in MS

    const scripts: ScriptConfig[] = [
        {
            scriptName: hacknetScriptName,
            enabled: true,
        },
        {
            scriptName: spiderScriptName,
            args: ['loop'],
            enabled: true,
        },
        {
            scriptName: loggerScriptName,
            enabled: true,
        },
    ];

    while (true) {
        scripts.forEach(script => {
            if (ns.scriptRunning(script.scriptName)) {
                if (!script.enabled) {
                    ns.scriptKill(script.scriptName);
                }

                return;
            }

            const serverAvailableRam = ns.getServerMaxRam(homeNode) - ns.getServerUsedRam(homeNode);
            const scriptRam = ns.getScriptRam(script.scriptName);

            const canRunScript = serverAvailableRam >= scriptRam;

            if (!canRunScript) {
                throw new Error(
                    `${script} RAM is too high for current server RAM. Available RAM is ${serverAvailableRam}, but script requires ${scriptRam}.`
                );
            }

            if (script.enabled) ns.run(script.scriptName, 1, ...(script.args || []));
        });

        await ns.sleep(sleepDuration);
    }
}

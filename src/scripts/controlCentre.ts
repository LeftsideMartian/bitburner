import { NS } from '@ns';
import {
    colors,
    configFileName,
    controlCentreScriptName,
    controllerScriptName,
    hacknetScriptName,
    homeNode,
    killAllScriptName,
    loggerScriptName,
    purchaseServerScriptName,
} from '../utils/constants';
import { ScriptConfig } from '/types';
import { readControlCentreConfig, writeConfigFile } from '/utils/utils';

export async function main(ns: NS) {
    try {
        await controlCentre(ns);
    } catch (error: unknown) {
        if (error instanceof Error)
            ns.printf(`${colors.red}Error in control centre: ${error.message}`);
    }
}

async function controlCentre(ns: NS) {
    ns.disableLog('ALL');

    const sleepDuration = 1 * 1000; // in MS
    let nextAllowedToast = Infinity;
    const timeBetweenToasts = 30 + 1000; // in MS

    // Default config
    let currentConfig: ScriptConfig[] = [
        {
            scriptName: controllerScriptName,
            args: ['n00dles'],
            enabled: true,
        },
        {
            scriptName: loggerScriptName,
            enabled: true,
        },
        {
            scriptName: hacknetScriptName,
            args: [4],
            enabled: false,
        },
        {
            scriptName: purchaseServerScriptName,
            args: [1],
            enabled: true,
        },
    ];
    let newConfig: ScriptConfig[] = currentConfig;

    // If there is no config, write default
    if (ns.read(configFileName) === '') writeConfigFile(ns, currentConfig);

    // Kill dependant scripts on exit
    ns.atExit(() => {
        currentConfig.forEach(script => ns.scriptKill(script.scriptName));
        ns.run(killAllScriptName);
    }, 'killScripts');

    while (true) {
        // Check if another control centre is running with a different PID
        const currentControlCentre = ns.getRunningScript(controlCentreScriptName);
        if (currentControlCentre && currentControlCentre.pid !== ns.pid) {
            // Another control centre is running, exit gracefully
            return;
        }

        // Read config from file
        try {
            newConfig = readControlCentreConfig(ns);
        } catch (error) {
            if (nextAllowedToast >= Date.now()) {
                ns.toast(`Malformatted JSON in ${configFileName}.`, 'error');
                // Set time limit on the above toast
                nextAllowedToast = Date.now() + timeBetweenToasts;
            }
        }

        for (const currentScriptConfig of currentConfig) {
            const newScriptConfig = newConfig.find(
                config => config.scriptName === currentScriptConfig.scriptName
            );

            // If script is removed from config, kill it
            if (newScriptConfig === undefined) {
                killScript(ns, currentScriptConfig);
                continue;
            }

            const isScriptRunning = ns.scriptRunning(newScriptConfig.scriptName);

            // Check if config has changed (comparing enabled/args)
            const argsChanged =
                JSON.stringify(newScriptConfig.args) !== JSON.stringify(currentScriptConfig.args);

            // If args changed, restart
            if (newScriptConfig.enabled && isScriptRunning && argsChanged) {
                restartScript(ns, newScriptConfig);
                continue;
            }

            // If script should not be running, kill it
            if (!newScriptConfig.enabled && isScriptRunning) {
                killScript(ns, newScriptConfig);
                continue;
            }

            // If script should be running but isn't, start it
            if (newScriptConfig.enabled && !isScriptRunning) {
                checkRamAvailable(ns, newScriptConfig);
                startScript(ns, newScriptConfig);
            }
        }

        // Check for new scripts in new config
        for (const newScriptConfig of newConfig) {
            const isExistingScript = currentConfig.find(
                c => c.scriptName === newScriptConfig.scriptName
            );

            if (!isExistingScript && newScriptConfig.enabled) {
                checkRamAvailable(ns, newScriptConfig);
                startScript(ns, newScriptConfig);
            }
        }

        currentConfig = newConfig;
        writeConfigFile(ns, currentConfig);

        await ns.sleep(sleepDuration);
    }
}

function checkRamAvailable(ns: NS, config: ScriptConfig) {
    const serverAvailableRam = ns.getServerMaxRam(homeNode) - ns.getServerUsedRam(homeNode);
    const scriptRam = ns.getScriptRam(config.scriptName);

    if (serverAvailableRam < scriptRam) {
        throw new Error(
            `${config.scriptName} requires ${scriptRam}GB, but only ${serverAvailableRam}GB available.`
        );
    }
}

function restartScript(ns: NS, config: ScriptConfig) {
    killScript(ns, config);
    startScript(ns, config);
}

function killScript(ns: NS, config: ScriptConfig) {
    ns.print(`Killing ${config.scriptName}.`);
    ns.scriptKill(config.scriptName);
}

function startScript(ns: NS, config: ScriptConfig) {
    const threads = config.threads ?? 1;
    const args = config.args || [];

    ns.print(
        `Starting ${config.scriptName} with the following: Threads: ${threads}, Args: [${args}].`
    );
    ns.run(config.scriptName, threads, ...args);
}

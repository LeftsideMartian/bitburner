import { NS } from '@ns';
import { controlCentreScriptName, controllerScriptName } from '/utils/constants';
import { readControlCentreConfig, writeConfigFile } from '/utils/utils';
import { ScriptConfig } from '/types';
import { ArgError } from '/errors/argError';

export async function main(ns: NS) {
    const levelToSwapToPhantasy = 800;

    let config = readControlCentreConfig(ns);

    changeHackTarget(ns, config, 'n00dles');
    ns.run(controlCentreScriptName, 1);
    // Once we hit high enough level, swap to phantasy and leave it there for now
    // Once player money hits abt 5-10B maybe, and include hack level for sure so hacks aren't slow on phantasy
    while (true) {
        config = readControlCentreConfig(ns);

        const hackLevel = ns.getPlayer().skills.hacking;
        if (hackLevel >= levelToSwapToPhantasy) {
            changeHackTarget(ns, config, 'phantasy');
        }

        if (isStartupDone(ns, config)) break;

        await ns.sleep(1000);
    }

    // Buy tor router
    // When enough money in account, buy programs
}

function changeHackTarget(ns: NS, config: ScriptConfig[], target: string) {
    config = config.map(script => {
        if (script.scriptName === controllerScriptName) {
            // Ensure args array exists before assigning
            script.args = script.args ?? [];
            script.args[0] = target;
        }
        return script;
    });
    writeConfigFile(ns, config);
}

function isStartupDone(ns: NS, config: ScriptConfig[]) {
    const hcConfig = config.find(script => script.scriptName === controllerScriptName);

    if (hcConfig === undefined) {
        throw new ArgError(
            'Hack controller not found in CC config. Expected ScriptConfig object for HackController script, but found none.'
        );
    }

    const currentHackTarget = hcConfig.args?.[0];

    if (currentHackTarget === undefined) {
        throw new ArgError('Hack controller did not have a target arg.');
    }

    return currentHackTarget === 'phantasy';
}

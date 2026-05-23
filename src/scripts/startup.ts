import { NS } from '@ns';
import { controlCentreScriptName, controllerScriptName } from '/utils/constants';
import { readControlCentreConfig, writeConfigFile } from '/utils/utils';

export async function main(ns: NS) {
    changeHackTarget(ns, 'n00dles');
    ns.run(controlCentreScriptName, 1);
    // Once we hit high enough level, swap to phantasy and leave it there for now
    // Once player money hits abt 5-10B maybe, and include hack level for sure so hacks aren't slow on phantasy

    // Buy tor router
    // When enough money in account, buy programs
}

function changeHackTarget(ns: NS, target: string) {
    let config = readControlCentreConfig(ns);
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

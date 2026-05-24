import { WorkerAction } from '/types';

export const homeNode = 'home';

// __________Scripts__________
// Hack controller
export const workerActions: WorkerAction[] = ['hack', 'weaken1', 'grow', 'weaken2'];
export const securityGrowthPerHackThread = 0.002;
export const securityGrowthPerGrowThread = 0.004;
export const securityDecreasePerWeakenThread = 0.05;
export const baseScriptRamCost = 1.6;
export const workerRamCost = 2.0;

export const purchaseServerPrefix = 'pserv-';
export const gangMemberPrefix = 'member-';

// __________Directories__________
const scriptDirectory = 'scripts/';
const coreDirectory = 'core/';
const shareDirectory = 'share/';
const gangDirectory = 'gang/';
const txtFileDirectory = 'txt/';
const hackControllerDirectory = 'hackController/';
const errorsDirectory = 'errors/';
const utilsDirectory = 'utils/';

// __________Txt files__________
export const serversFileName = txtFileDirectory + 'servers.txt';
export const configFileName = txtFileDirectory + 'config.txt';

// __________Script names__________
// Core
export const allServersScriptName = scriptDirectory + coreDirectory + 'allServers.js';
export const controlCentreScriptName = scriptDirectory + coreDirectory + 'controlCentre.js';
export const findServerScriptName = scriptDirectory + coreDirectory + 'findServer.js';
export const hacknetScriptName = scriptDirectory + coreDirectory + 'hacknet.js';
export const killAllScriptName = scriptDirectory + coreDirectory + 'killExternalScripts.js';
export const loggerScriptName = scriptDirectory + coreDirectory + 'logger.js';
export const purchaseServerScriptName = scriptDirectory + coreDirectory + 'purchaseServers.js';
export const spiderScriptName = scriptDirectory + coreDirectory + 'spider.js';
export const xpJoesGunsScriptName = scriptDirectory + coreDirectory + 'xpJoesGuns.js';

// Hack controller
export const controllerUtilsScriptName =
    scriptDirectory + hackControllerDirectory + 'controllerUtils.js';
export const controllerScriptName = scriptDirectory + hackControllerDirectory + 'hackController.js';
export const workerScriptName = scriptDirectory + hackControllerDirectory + 'worker.js';

// Share
export const shareScriptName = scriptDirectory + shareDirectory + 'share.js';
export const shareNetworkScriptName = scriptDirectory + shareDirectory + 'shareNetwork.js';

// Gang
export const gangScriptName = scriptDirectory + gangDirectory + 'gang.js';

// Utils
export const constantsFileName = utilsDirectory + 'constants.js';
export const programsFileName = utilsDirectory + 'programs.js';
export const utilsFileName = utilsDirectory + 'utils.js';

// Errors
export const argErrorFileName = errorsDirectory + 'argError.js';

// __________Ports__________
export const nullPortData = 'NULL PORT DATA';
export const loggerPortNumber = 1;

// __________Print__________
export const colors = {
    red: '\u001b[31m',
    yellow: '\u001b[33m',
    green: '\u001b[32m',
    cyan: '\u001b[36m',
    standard: '\u001b[0m',
};

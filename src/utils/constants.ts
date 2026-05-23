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

// __________Directories__________
const scriptDirectory = 'scripts/';
const txtFileDirectory = 'txt/';
const hackControllerDirectory = 'hackController/';
const errorsDirectory = 'errors/';
const utilsDirectory = 'utils/';

// __________Txt files__________
export const serversFileName = txtFileDirectory + 'servers.txt';
export const configFileName = txtFileDirectory + 'config.txt';

// __________Script names__________
export const spiderScriptName = scriptDirectory + 'spider.js';
export const hacknetScriptName = scriptDirectory + 'hacknet.js';
export const purchaseServerScriptName = scriptDirectory + 'purchaseServers.js';
export const loggerScriptName = scriptDirectory + 'logger.js';
export const controllerScriptName = scriptDirectory + hackControllerDirectory + 'hackController.js';
export const workerScriptName = scriptDirectory + hackControllerDirectory + 'worker.js';
export const controllerUtilsScriptName =
    scriptDirectory + hackControllerDirectory + 'controllerUtils.js';
export const controlCentreScriptName = scriptDirectory + 'controlCentre.js';
export const shareScriptName = scriptDirectory + 'share.js';
export const killAllScriptName = scriptDirectory + 'killExternalScripts.js';
export const constantsFileName = utilsDirectory + 'constants.js';
export const programsFileName = utilsDirectory + 'programs.js';
export const utilsFileName = utilsDirectory + 'utils.js';
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

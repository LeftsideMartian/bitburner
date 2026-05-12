import { WorkerAction } from '/types';

export const homeNode = 'home';

// Hack controller
export const workerActions: WorkerAction[] = ['hack', 'weaken1', 'grow', 'weaken2'];
export const securityGrowthPerHackThread = 0.002;
export const securityGrowthPerGrowThread = 0.004;
export const securityDecreasePerWeakenThread = 0.05;
export const baseScriptRamCost = 1.6;
export const workerRamCost = 2.05;

// Directories
const scriptDirectory = 'scripts/';
const txtFileDirectory = 'txt/';
const hackControllerDirectory = 'hackController/';
const errorsDirectory = 'errors/';
const utilsDirectory = 'utils/';

// Txt files
export const serversFileName = txtFileDirectory + 'servers.txt';

// Scripts
export const spiderScriptName = scriptDirectory + 'spider.js';
export const hacknetScriptName = scriptDirectory + 'hacknet.js';
export const loggerScriptName = scriptDirectory + 'logger.js';
export const controllerScriptName = scriptDirectory + hackControllerDirectory + 'hackController.js';
export const workerScriptName = scriptDirectory + hackControllerDirectory + 'worker.js';
export const controllerUtilsScriptName =
    scriptDirectory + hackControllerDirectory + 'controllerUtils.js';
export const constantsFileName = utilsDirectory + 'constants.js';
export const programsFileName = utilsDirectory + 'programs.js';
export const utilsFileName = utilsDirectory + 'utils.js';
export const argErrorFileName = errorsDirectory + 'argError.js';

// Ports
export const nullPortData = 'NULL PORT DATA';
export const loggerPortNumber = 1;

// Print
export const colors = {
    red: '\u001b[31m',
    yellow: '\u001b[33m',
    green: '\u001b[32m',
    cyan: '\u001b[36m',
    standard: '\u001b[0m',
};

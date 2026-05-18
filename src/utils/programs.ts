import { NS } from '@ns';
import { AllPrograms } from '/types';

export const getPrograms = (ns: NS): AllPrograms => ({
    'BruteSSH.exe': {
        nsFunc: ns.brutessh,
    },
    'FTPCrack.exe': {
        nsFunc: ns.ftpcrack,
    },
    'relaySMTP.exe': {
        nsFunc: ns.relaysmtp,
    },
    'HTTPWorm.exe': {
        nsFunc: ns.httpworm,
    },
    'SQLInject.exe': {
        nsFunc: ns.sqlinject,
    },
});

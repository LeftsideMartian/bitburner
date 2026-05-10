import { NS } from '@ns';

interface Program {
    exe: string;
    nsFunc: (host: string) => boolean;
}

interface AllPrograms {
    [key: string]: Program;
}

export const getPrograms: (ns: NS) => AllPrograms = (ns: NS) => ({
    nuke: {
        exe: 'NUKE.exe',
        nsFunc: ns.nuke,
    },
    brutessh: {
        exe: 'BruteSSH.exe',
        nsFunc: ns.brutessh,
    },
    ftpcrack: {
        exe: 'FTPCrack.exe',
        nsFunc: ns.ftpcrack,
    },
    relaysmtp: {
        exe: 'relaySMTP.exe',
        nsFunc: ns.relaysmtp,
    },
    httpworm: {
        exe: 'HTTPWorm.exe',
        nsFunc: ns.httpworm,
    },
    sqlinject: {
        exe: 'SQLInject.exe',
        nsFunc: ns.sqlinject,
    },
});

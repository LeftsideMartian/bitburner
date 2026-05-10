import { NS } from '@ns';

export async function main(ns: NS) {
    const target = 'n00dles';
    const moneyThresh = ns.getServerMaxMoney(target);
    const securityThresh = ns.getServerSecurityLevel(target);

    if (ns.fileExists('BruteSSH.exe', 'home')) {
        ns.brutessh(target);
    }

    ns.nuke(target);

    while (true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else if (ns.getServerMaxMoney(target) < moneyThresh) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}

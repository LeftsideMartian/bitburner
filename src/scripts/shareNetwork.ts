import { NS } from '@ns';
import { homeNode, shareScriptName } from '/utils/constants';
import { getServers } from '/utils/utils';

export async function main(ns: NS) {
    const servers = getServers(ns);
    servers.push(homeNode);

    servers.forEach(server => {
        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const shareRam = ns.getScriptRam(shareScriptName);

        const availableRam = maxRam - usedRam;
        const isEnoughRamToRunShare = availableRam >= shareRam;

        const threads = Math.floor(availableRam / shareRam);

        if (isEnoughRamToRunShare) ns.exec(shareScriptName, server, threads);
    });
}

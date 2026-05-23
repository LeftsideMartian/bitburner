import { NS } from '@ns';
import { scrapeNetwork } from './spider';
import { workerRamCost, workerScriptName } from '/utils/constants';
import { Job } from '/types';

export async function main(ns: NS) {
    ns.disableLog('ALL');

    const target = 'joesguns';

    while (true) {
        const growTime = ns.getGrowTime(target);
        const servers = scrapeNetwork(ns);

        // Filter out home and sort by available RAM (largest first)
        const workServers = servers
            .filter(server => ns.hasRootAccess(server))
            .sort((a, b) => {
                const aRam = ns.getServerMaxRam(a) - ns.getServerUsedRam(a);
                const bRam = ns.getServerMaxRam(b) - ns.getServerUsedRam(b);
                return bRam - aRam;
            });

        for (const server of workServers) {
            const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            const maxThreads = Math.floor(availableRam / workerRamCost);

            if (maxThreads < 1) {
                continue;
            }

            const job: Job = {
                action: 'grow',
                threads: maxThreads,
                target: target,
                duration: growTime,
                endTime: 0,
                host: server,
                controllerPort: ns.pid,
                ramCost: maxThreads * workerRamCost,
                batchNum: 0,
                reportToController: false,
            };

            ns.exec(workerScriptName, server, maxThreads, JSON.stringify(job));
        }

        // Wait before redeploying
        await ns.sleep(growTime + 500);
    }

    ns.print(`Target level reached: ${ns.getPlayer().skills.hacking}`);
}

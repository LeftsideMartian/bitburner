import { NS } from '@ns';
import { homeNode } from '/utils/constants';

export async function main(ns: NS) {
    await manageHacknet(ns);
}

export async function manageHacknet(ns: NS) {
    const hacknet = ns.hacknet;

    const purchaseThreshold = 4; // Number of e's to set the purchase limit
    const purchaseLimit = 10 ** purchaseThreshold;
    const sleepDuration = 1000; // in MS

    let numOfOwnedNodes = hacknet.numNodes();

    while (true) {
        const maxCost = ns.getServerMoneyAvailable(homeNode) / purchaseLimit;

        // Try to purchase new node
        if (maxCost >= hacknet.getPurchaseNodeCost()) {
            hacknet.purchaseNode();
            numOfOwnedNodes++;
        }

        // Try to upgrade all nodes
        for (let i = 0; i < numOfOwnedNodes; i++) {
            if (maxCost >= hacknet.getLevelUpgradeCost(i)) hacknet.upgradeLevel(i);
            if (maxCost >= hacknet.getRamUpgradeCost(i)) hacknet.upgradeRam(i);
            if (maxCost >= hacknet.getCoreUpgradeCost(i)) hacknet.upgradeCore(i);
        }

        await ns.sleep(sleepDuration);
    }
}

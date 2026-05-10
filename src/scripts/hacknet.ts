import { NS } from '@ns';
import { homeNode } from '../utils/constants';

export async function main(ns: NS) {
    await manageHacknet(ns);
}

export async function manageHacknet(ns: NS) {
    const hacknet = ns.hacknet;

    const hacknetPurchaseThreshold = 100;
    const sleepDuration = 1000; // in MS

    let numOfOwnedNodes = hacknet.numNodes();

    while (true) {
        const currentMoney = ns.getServerMoneyAvailable(homeNode);
        const purchaseThreshold = currentMoney / hacknetPurchaseThreshold;

        // Try to purchase new node
        if (hacknet.getPurchaseNodeCost() <= purchaseThreshold) {
            hacknet.purchaseNode();
            numOfOwnedNodes++;
        }

        // Try to upgrade all nodes
        for (let i = 0; i < numOfOwnedNodes; i++) {
            if (hacknet.getLevelUpgradeCost(i) <= purchaseThreshold) hacknet.upgradeLevel(i);
            if (hacknet.getRamUpgradeCost(i) <= purchaseThreshold) hacknet.upgradeRam(i);
            if (hacknet.getCoreUpgradeCost(i) <= purchaseThreshold) hacknet.upgradeCore(i);
        }

        await ns.sleep(sleepDuration);
    }
}

import { NS } from '@ns';
import { homeNode, purchaseServerPrefix } from '/utils/constants';

let purchaseThreshold = 0; // Number of e's for which to set the purchase limit
const purchaseLimit = 10 ** purchaseThreshold;

export async function main(ns: NS) {
    ns.disableLog('ALL');

    if (typeof ns.args[0] === 'number') {
        purchaseThreshold = ns.args[0];
    }

    while (true) {
        managePurchaseServers(ns);
        await ns.sleep(1000);
    }
}

function managePurchaseServers(ns: NS) {
    buyNewServers(ns);
    upgradeServers(ns);
}

function buyNewServers(ns: NS) {
    const cloud = ns.cloud;

    // const ramLimit = cloud.getRamLimit();
    // const ramToBuy = getTargetRam(ns, ramLimit);
    const ramToBuy = 2;
    const maxServers = cloud.getServerLimit(); // Max is 25 for now ig
    let numOfPurchaseServers = cloud.getServerNames().length;

    let currentMoney = ns.getServerMoneyAvailable(homeNode);

    // Purchase new servers
    while (
        currentMoney / purchaseLimit >= cloud.getServerCost(ramToBuy) &&
        numOfPurchaseServers < maxServers
    ) {
        numOfPurchaseServers = cloud.getServerNames().length;
        const newServerName = purchaseServerPrefix + (numOfPurchaseServers + 1);

        ns.print(`Buying new server named ${newServerName} with ${ramToBuy}GB of RAM.`);
        cloud.purchaseServer(newServerName, ramToBuy);
        currentMoney = ns.getServerMoneyAvailable(homeNode);
    }
}

function upgradeServers(ns: NS) {
    const cloud = ns.cloud;

    const purchaseServers = cloud.getServerNames();
    const ramLimit = cloud.getRamLimit();
    const currentMoney = ns.getServerMoneyAvailable(homeNode);

    // Upgrade existing
    for (const server of purchaseServers) {
        const serverRam = ns.getServerMaxRam(server);
        const targetRam = serverRam * 2; // One upgrade

        if (targetRam > ramLimit) {
            continue;
        }

        if (currentMoney / purchaseLimit >= cloud.getServerUpgradeCost(server, targetRam)) {
            ns.print(`Upgrading server ${server} from ${serverRam}GB -> ${targetRam}GB.`);
            cloud.upgradeServer(server, targetRam);
        }
    }
}

function getTargetRam(ns: NS, ramLimit: number) {
    const cloud = ns.cloud;

    const currentMoney = ns.getServerMoneyAvailable(homeNode);
    let ramTier = 1; // Ram prices are 2^n where n is [1, 20]; this variable refers to the value of n.

    for (let i = 1; i <= Math.log2(ramLimit); i++) {
        if (currentMoney >= cloud.getServerCost(2 ** i) / purchaseLimit) {
            ramTier = i;
        }
    }

    return 2 ** ramTier;
}

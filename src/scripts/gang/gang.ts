import { NS } from '@ns';
import { MyGang } from './MyGang';
import { GangTaskStrategy, validStrategies } from '/types';

let purchaseThreshold = 0; // Number of e's for which to set the purchase limit
const purchaseLimit = 10 ** purchaseThreshold;

export async function main(ns: NS) {
    ns.disableLog('ALL');

    await manageGang(ns);
}

async function manageGang(ns: NS) {
    if (typeof ns.args[0] === 'number') {
        purchaseThreshold = ns.args[0];
    }

    const strategy = ns.args[1] as GangTaskStrategy;

    if (!validStrategies.includes(strategy)) {
        throw new Error(
            `Invalid strategy: ${strategy}. Must be one of: ${validStrategies.join(', ')}`
        );
    }

    const myGang = new MyGang(ns, purchaseLimit, strategy);

    while (true) {
        myGang.update(ns);
        await ns.gang.nextUpdate();
    }
}

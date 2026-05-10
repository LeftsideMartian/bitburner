import { NS } from '@ns';

export async function main(ns: NS) {
    while (true) {
        await ns.share();
        await ns.share();
        await ns.sleep(100);
    }
}

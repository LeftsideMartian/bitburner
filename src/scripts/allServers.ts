import { NS } from '@ns';
import { scrapeNetwork } from './spider';

export async function main(ns: NS) {
    ns.tprint(`All servers: ${scrapeNetwork(ns)}`);
}

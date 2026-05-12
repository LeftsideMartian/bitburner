import { NS } from '@ns';
import { getServers, prep } from './controllerUtils';

export async function main(ns: NS) {
    const servers = getServers(ns);
    const target = servers['n00dles'];

    await prep(ns, target);
}

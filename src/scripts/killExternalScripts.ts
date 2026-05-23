import { NS } from '@ns';
import { getServers } from '/utils/utils';

export async function main(ns: NS) {
    const servers = getServers(ns);
    servers.forEach(server => ns.killall(server, true));
}

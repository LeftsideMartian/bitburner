import { NS } from '@ns';
import { deployAllScripts, getServers } from '/utils/utils';

export async function main(ns: NS) {
    deployAllScripts(ns, getServers(ns));
}

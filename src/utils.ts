import { NS, Server } from '@ns';
import { homeNode, serversFileName } from './constants';

export const getServersList = (ns: NS): string[] => {
    const serversFile = ns.read(serversFileName);

    if (serversFile === '') {
        throw new ReferenceError(`${serversFileName} does not exist on this host.`);
    }

    return serversFile.split('\n');
};
export const getExternalServersList = (ns: NS): string[] =>
    getServersList(ns).filter(server => server !== homeNode);
export const getExternalServersListTyped = (ns: NS): Server[] =>
    getExternalServersList(ns).map(node => ns.getServer(node) as Server); // Filtering out Darknet servers - these WILL NOT be included in return

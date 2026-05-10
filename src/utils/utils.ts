import { NS, Server } from '@ns';
import { homeNode, serversFileName } from './constants';

type NSMethods = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof NS]: NS[K] extends (...args: any[]) => any ? K : never;
}[keyof NS];

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

export const disableLogging = (ns: NS, nsMethods: NSMethods[]) =>
    nsMethods.forEach(method => ns.disableLog(method));

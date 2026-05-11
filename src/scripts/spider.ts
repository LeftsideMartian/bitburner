import { NS } from '@ns';
import { homeNode, serversFileName } from '../utils/constants';

type SpiderMode = 'single' | 'loop' | undefined;

export async function main(ns: NS) {
    const mode = ns.args[0] as SpiderMode;

    if (mode === undefined) {
        ns.toast('No mode argument was passed. Choose either single or loop mode.', 'error');
        return;
    }

    if (mode === 'single') {
        updateServersFile(ns);
        ns.toast(
            'Spider scraped the network for all servers, and wrote data to servers.txt.',
            'success'
        );
    } else if (mode === 'loop') {
        const ms = 60000; // Run every 60 seconds

        while (true) {
            updateServersFile(ns);
            await ns.sleep(ms);
        }
    }
}

export function updateServersFile(ns: NS): string[] {
    const servers = scrapeNetwork(ns);
    ns.write(serversFileName, servers.join('\n'), 'w');
    return servers;
}

export function scrapeNetwork(ns: NS): string[] {
    let currentNode = homeNode;
    const nodes: string[] = ns.scan();
    const results: string[] = [];

    nodes.push(currentNode);

    while (nodes.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        currentNode = nodes.shift()!; // There will always be a node here, so unwrap is safe
        results.push(currentNode);

        const scanResults = ns.scan(currentNode);
        scanResults.shift(); // Remove home from results

        nodes.push(...scanResults);
        results.push(...scanResults);
    }

    return [...new Set(results.filter(node => node !== homeNode))];
}

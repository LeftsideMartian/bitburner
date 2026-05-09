import { NS } from '@ns';
import { getPrograms } from './programs';
import { homeNode, serversFileName } from './constants';

export async function main(ns: NS) {
    updateServersFile(ns);
}

export function updateServersFile(ns: NS): void {
    ns.write(
        serversFileName,
        scrapeNetwork(ns)
            .filter(node => isNodeHackable(ns, node))
            .join('\n'),
        'w'
    );

    ns.tprint('Spider scraped the network for all servers, and wrote data to servers.txt.');
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

    return [...new Set(results)];
}

function isNodeHackable(ns: NS, node: string): boolean {
    const isHackingLevelHighEnough = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(node);
    const hasRootAccess = ns.hasRootAccess(node);

    if (!isHackingLevelHighEnough) {
        return false;
    }

    if (hasRootAccess) {
        return true;
    }

    let ports = 0;

    // Attempt to run all programs
    Object.values(getPrograms(ns)).forEach(program => {
        if (ns.fileExists(program.exe, homeNode)) {
            program.nsFunc(node);
            ports++;
        }
    });

    const areEnoughPortsOpen = ports >= ns.getServerNumPortsRequired(node);

    // Ensure all hackable servers have root access
    if (areEnoughPortsOpen) {
        return ns.nuke();
    } else {
        return false;
    }
}

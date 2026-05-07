import { NS } from '@ns';
import { programs } from './programs';

export async function main(ns: NS) {
    let currentNode = 'home';
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

    ns.write(
        'servers.txt',
        [...new Set(results)].filter(node => isNodeHackable(ns, node)).join('\n'),
        'w'
    );

    ns.tprint('Spider scraped the network for all servers, and wrote data to servers.txt.');
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
    Object.entries(programs).forEach(([program, exe]) => {
        if (ns.fileExists(exe, 'home')) {
            ns.tprint('HELLO');
            (ns[program as keyof NS] as (arg: string) => boolean)(node);
            ports++;
        }
    });

    const areEnoughPortsOpen = ports >= ns.getServerNumPortsRequired(node);

    if (areEnoughPortsOpen) {
        return ns.nuke();
    } else {
        return false;
    }
}

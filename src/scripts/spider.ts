import { NS } from '@ns';
import { ArgError } from '../errors/argError';
import { getPrograms } from '../utils/programs';
import { homeNode, serversFileName } from '../utils/constants';

export async function main(ns: NS) {
    const mode = ns.args[0];

    if (mode === 'single') {
        updateServersFile(ns);
        return;
    } else if (mode === 'loop') {
        const ms = 60000; // Run every 60 seconds

        while (true) {
            updateServersFile(ns);
            await ns.sleep(ms);
        }
    } else {
        if (mode === null || mode === '') {
            throw new ArgError('No mode argument was passed. Choose either single or loop mode.');
        } else {
            throw new ArgError('Mode was not single or loop.');
        }
    }
}

export function updateServersFile(ns: NS): void {
    ns.write(
        serversFileName,
        scrapeNetwork(ns)
            .filter(node => isNodeHackable(ns, node))
            .join('\n'),
        'w'
    );

    ns.print('Spider scraped the network for all servers, and wrote data to servers.txt.');
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

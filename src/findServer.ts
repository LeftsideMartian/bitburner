import { NS } from '@ns';
import { getExternalServersList } from './utils';
import { updateServersFile } from './spider';

export async function main(ns: NS) {
    const targetServer = ns.args[0].toString();
    const originNode = ns.getHostname();

    updateServersFile(ns);
    const servers: string[] = getExternalServersList(ns);

    if (!servers.includes(targetServer)) {
        ns.tprint('Could not find target server in network.');
        return;
    }

    const path = findTargetServer(ns, originNode, targetServer).join(' -> ');

    ns.tprint(path);
}

function findTargetServer(ns: NS, originNode: string, targetNode: string) {
    const queue: string[] = [originNode];
    const visited: Set<string> = new Set([originNode]);
    const parentOf: Record<string, string | null> = { [originNode]: null };

    while (queue.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const currentNode = queue.shift()!; // Dequeue

        if (currentNode === targetNode) {
            const path: string[] = [];
            let node: string | null = targetNode;

            while (node !== null) {
                path.unshift(node);
                node = parentOf[node];
            }

            return path;
        }

        const neighbors = ns.scan(currentNode);
        neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
                visited.add(neighbor);
                parentOf[neighbor] = currentNode;
            }
        });
    }

    throw new EvalError(`Could not find target node ${targetNode}.`);
}

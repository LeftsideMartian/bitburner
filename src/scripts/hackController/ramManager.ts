import { NS } from '@ns';
import { baseScriptRamCost, workerRamCost } from '/utils/constants';
import { Job } from '/types';

interface ServerRam {
    hostName: string;
    availableRam: number;
}

export class RamManager {
    totalRam: number;
    availableRam: number;
    minAvailableRam: number;
    maxAvailableRam: number;
    availablePrepThreads: number;
    servers: ServerRam[];
    serverMap: Map<string, number>;

    constructor(ns: NS, servers: string[]) {
        this.totalRam = 0;
        this.availableRam = 0;
        this.minAvailableRam = Infinity;
        this.maxAvailableRam = 0;
        this.availablePrepThreads = 0;
        this.servers = [];
        this.serverMap = new Map();

        servers.forEach(server => {
            const maxRam = ns.getServerMaxRam(server);
            const availableRam = maxRam - ns.getServerUsedRam(server);

            if (availableRam >= baseScriptRamCost) {
                this.servers.push({
                    hostName: server,
                    availableRam: availableRam,
                });

                this.totalRam += maxRam;
                this.availableRam += availableRam;
                this.availablePrepThreads = Math.floor(availableRam / workerRamCost);
                if (availableRam < this.minAvailableRam) this.minAvailableRam = availableRam;
                if (availableRam > this.maxAvailableRam) this.maxAvailableRam = availableRam;
            }
        });

        this.sort();
        this.servers.forEach((server, i) => this.serverMap.set(server.hostName, i));
    }

    sort() {
        this.servers.sort((a, b) => b.availableRam - a.availableRam);
    }

    getServer(server: string) {
        if (this.serverMap.has(server)) {
            return this.servers[this.serverMap.get(server) as number];
        } else {
            throw new Error(`Server ${server} not found in ramManager.`);
        }
    }

    assignJob(job: Job) {
        const server = this.servers.find(server => server.availableRam >= job.ramCost);

        if (server) {
            job.host = server.hostName;
            server.availableRam -= job.ramCost;
            this.totalRam -= job.ramCost;
            return true;
        } else {
            return false;
        }
    }

    finishJob(job: Job) {
        const server = this.getServer(job.host);
        server.availableRam += job.ramCost;
        this.totalRam += job.ramCost;
    }
}

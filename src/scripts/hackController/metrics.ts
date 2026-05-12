import { NS } from '@ns';
import { ActionValues } from '/types';
import { workerRamCost, workerScriptName } from '/utils/constants';

export class Metrics {
    target: string;
    hackChance: number;
    maxMoney: number;
    currentMoney: number;
    minimumSecurity: number;
    currentSecurity: number;
    threads: ActionValues;
    durations: ActionValues;
    endTimes: ActionValues;
    greed: number; // % of money to steal
    cumulativeDelay: number;
    controllerPort: number;
    workerRam: number;
    actionBuffer: number; // In ms

    constructor(ns: NS, target: string) {
        this.target = target;
        this.hackChance = ns.hackAnalyzeChance(target);
        this.maxMoney = ns.getServerMaxMoney(target);
        this.currentMoney = ns.getServerMoneyAvailable(target);
        this.minimumSecurity = ns.getServerMinSecurityLevel(target);
        this.currentSecurity = ns.getServerSecurityLevel(target);

        this.threads = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
        this.durations = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
        this.endTimes = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };

        this.greed = 0.1;
        this.cumulativeDelay = 0;

        this.controllerPort = ns.pid;
        this.workerRam = workerRamCost;
        this.actionBuffer = 5;
    }

    public calculate(ns: NS, greed: number = this.greed) {
        this.hackChance = ns.hackAnalyzeChance(this.target);
        this.currentMoney = ns.getServerMoneyAvailable(this.target);
        this.currentSecurity = ns.getServerSecurityLevel(this.target);

        this.greed = greed;
        this.calculateThreads(ns);
        this.calculateDurations(ns);
    }

    private calculateThreads(ns: NS) {
        const securityGrowthPerHackThread = 0.002;
        const securityGrowthPerGrowThread = 0.004;
        const securityDecreasePerWeakenThread = 0.05;

        const moneyToSteal = this.greed * this.maxMoney;

        const hackThreads = Math.max(
            Math.floor(ns.hackAnalyzeThreads(this.target, moneyToSteal)),
            1
        );
        const growThreads = Math.ceil(
            ns.growthAnalyze(this.target, this.maxMoney / (this.maxMoney - moneyToSteal))
        );
        const weaken1Threads = Math.max(
            Math.floor(
                (hackThreads * securityGrowthPerHackThread) / securityDecreasePerWeakenThread
            ),
            1
        );
        const weaken2Threads = Math.max(
            Math.floor((growThreads * securityGrowthPerHackThread) / securityGrowthPerGrowThread),
            1
        );

        this.threads = {
            hack: hackThreads,
            weaken1: weaken1Threads,
            grow: growThreads,
            weaken2: weaken2Threads,
        };
    }

    private calculateDurations(ns: NS) {
        const weakenTime = ns.getWeakenTime(this.target);
        const hackTime = weakenTime / 4;
        const growTime = weakenTime * 0.8;

        this.durations = {
            hack: hackTime,
            weaken1: weakenTime,
            grow: growTime,
            weaken2: weakenTime,
        };
    }
}

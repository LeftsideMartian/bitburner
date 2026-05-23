import { NS } from '@ns';
import { ActionValues, PrepStrategy, WorkerAction } from '/types';
import {
    securityDecreasePerWeakenThread,
    securityGrowthPerGrowThread,
    securityGrowthPerHackThread,
    workerActions,
    workerRamCost,
} from '/utils/constants';

export class Metrics {
    target: string;
    hackChance: number;
    maxMoney: number;
    currentMoney: number;
    minimumSecurity: number;
    currentSecurity: number;
    isPrepped: boolean;
    threads: ActionValues;
    durations: ActionValues;
    endTime: number;
    greed: number; // % of money to steal
    numOfBatches: number;
    cumulativeDelay: number;
    controllerPort: number;
    workerRam: number;
    actionBuffer: number; // In ms
    actions: WorkerAction[];
    prepStrategy: PrepStrategy;

    constructor(ns: NS, target: string) {
        this.target = target;
        this.hackChance = ns.hackAnalyzeChance(target);
        this.maxMoney = ns.getServerMaxMoney(target);
        this.currentMoney = ns.getServerMoneyAvailable(target);
        this.minimumSecurity = ns.getServerMinSecurityLevel(target);
        this.currentSecurity = ns.getServerSecurityLevel(target);
        this.isPrepped = this.checkIsPrepped(ns);

        this.threads = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
        this.durations = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
        this.endTime = 0;

        this.greed = 0.1;
        this.numOfBatches = 1;
        this.cumulativeDelay = 0;

        this.controllerPort = ns.pid;
        this.workerRam = workerRamCost;
        this.actionBuffer = 5;
        this.actions = workerActions;
        this.prepStrategy = 'none';
    }

    public calculate(ns: NS) {
        this.hackChance = ns.hackAnalyzeChance(this.target);
        this.currentMoney = ns.getServerMoneyAvailable(this.target);
        this.currentSecurity = ns.getServerSecurityLevel(this.target);
        this.isPrepped = this.checkIsPrepped(ns);

        this.calculateThreads(ns);
        this.calculateDurations(ns);
    }

    private calculateThreads(ns: NS) {
        const moneyToSteal = this.greed * this.maxMoney;

        const hackThreads = Math.max(
            Math.floor(ns.hackAnalyzeThreads(this.target, moneyToSteal)),
            1
        );
        const growThreads = Math.ceil(
            ns.growthAnalyze(this.target, this.maxMoney / (this.maxMoney - moneyToSteal))
        );
        const weaken1Threads = Math.max(
            Math.ceil(
                (hackThreads * securityGrowthPerHackThread) / securityDecreasePerWeakenThread
            ),
            1
        );
        const weaken2Threads = Math.max(
            Math.ceil(
                (growThreads * securityGrowthPerGrowThread) / securityDecreasePerWeakenThread
            ),
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

    public checkIsPrepped(ns: NS) {
        this.isPrepped = this.getIsSecurityPrepped(ns) && this.getIsMoneyPrepped(ns);
        return this.isPrepped;
    }
    public getIsSecurityPrepped(ns: NS) {
        return ns.getServerSecurityLevel(this.target) <= ns.getServerMinSecurityLevel(this.target);
    }
    public getIsMoneyPrepped(ns: NS) {
        return ns.getServerMoneyAvailable(this.target) >= ns.getServerMaxMoney(this.target);
    }
}

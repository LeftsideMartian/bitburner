import { NS } from '@ns';

// Logging
export type LogType = 'info' | 'warning' | 'error' | 'success' | 'fatal';

export interface Log {
    message: string;
    type: LogType;
}

// Controller
export type ServerDataCollection = { [key: string]: ServerData };

export interface ServerData {
    hostName: string;
    totalRam: number;
    usedRam: number;
    hasRootAccess: boolean;
    currentSecurityLevel: number;
    minSecurityLevel: number;
    currentMoney: number;
    maxMoney: number;
    serverGrowth: number;
    targetScore: number;
    isPrepped: boolean;
    hackChance: number;
}

// Worker
export type WorkerAction = 'hack' | 'weaken1' | 'grow' | 'weaken2';

export type BatchDelays = {
    [key in WorkerAction]: number;
};

export type BatchThreads = {
    [key in WorkerAction]: number;
};

export type BatchTimes = {
    [key in WorkerAction]: number;
};

export interface Batch {
    target: ServerData;
    delays: BatchDelays;
    threads: BatchThreads;
    times: BatchTimes;
    jobs: Job[];
}

export interface Job {
    action: WorkerAction;
    threads: number;
    target: string;
    delay: number;
    host: string;
}

// NS
type GetMethods<T, Prefix extends string = ''> =
    | {
          [K in keyof T]: K extends string
              ? T[K] extends (...args: any[]) => any
                  ? Prefix extends ''
                      ? K
                      : `${Prefix}.${K}`
                  : never
              : never;
      }[keyof T]
    | {
          [K in keyof T]: K extends string
              ? Exclude<T[K], undefined | null> extends object
                  ? Exclude<T[K], undefined | null> extends (...args: any[]) => any
                      ? never
                      : GetMethods<
                            Exclude<T[K], undefined | null>,
                            Prefix extends '' ? K : `${Prefix}.${K}`
                        >
                  : never
              : never;
      }[keyof T];

export type NSMethods = GetMethods<NS>;

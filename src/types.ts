import { EquipmentStats, GangTaskStats, ProgramName, ScriptArg } from '@ns';

// Logging
export type LogType = 'info' | 'warning' | 'error' | 'success' | 'fatal';

export interface Log {
    message: string;
    type: LogType;
}

// Alias
export interface AliasConfig {
    script: string;
    args?: string[];
    prefix?: string;
    suffix?: string;
}

export type Aliases = Record<string, AliasConfig>;

// Worker
export type WorkerAction = 'hack' | 'weaken1' | 'grow' | 'weaken2';

export type ActionValues = {
    [key in WorkerAction]: number;
};

export interface Job {
    action: WorkerAction;
    threads: number;
    target: string;
    duration: number;
    endTime: number;
    host: string;
    controllerPort: number;
    ramCost: number;
    batchNum: number;
    reportToController: boolean;
}

// Prep
export type PrepStrategy = 'grow' | 'weak' | 'both' | 'none';

// Programs
export interface Program {
    nsFunc: (host: string) => boolean;
}

export type AllPrograms = Partial<{ [key in ProgramName]: Program }>;

export interface ScriptConfig {
    scriptName: string;
    threads?: number;
    args?: ScriptArg[];
    enabled: boolean;
}

// Gang
export const validStrategies = ['income', 'respect'] as const;
export type GangTaskStrategy = (typeof validStrategies)[number];

export interface TaskTypes {
    income: GangTaskStats[];
    training: GangTaskStats[];
    unassigned: GangTaskStats;
    respect: GangTaskStats;
    wanted: GangTaskStats;
    territory: GangTaskStats;
}

export type EquipmentType = 'weapon' | 'armor' | 'vehicle' | 'rootkit' | 'augmentation';

export interface Equipment {
    name: string;
    type: EquipmentType;
    stats: EquipmentStats;
    cost: number;
}

export type EquipmentTypes = {
    [key in EquipmentType]: Equipment[];
};

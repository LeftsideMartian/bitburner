import { NS } from '@ns';

// Logging
export type LogType = 'info' | 'warning' | 'error' | 'success' | 'fatal';

export interface Log {
    message: string;
    type: LogType;
}

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

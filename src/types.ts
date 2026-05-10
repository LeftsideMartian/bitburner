// Logging
type LogType = 'info' | 'warning' | 'error' | 'success' | 'fatal';

interface Log {
    message: string;
    type: LogType;
}

// Worker
type WorkerAction = 'g' | 'w' | 'h' | '_';

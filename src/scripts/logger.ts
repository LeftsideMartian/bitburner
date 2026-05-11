import { NS } from '@ns';
import { colors, loggerPortNumber, nullPortData } from '/utils/constants';
import { disableLogging } from '/utils/utils';
import { Log, LogType } from '/types';

export async function main(ns: NS) {
    disableLogging(ns, ['sleep']);

    ns.clearPort(loggerPortNumber);

    let portContent;

    while (true) {
        await ns.nextPortWrite(loggerPortNumber);

        // Process all queued logs
        while ((portContent = ns.readPort(loggerPortNumber)) !== nullPortData) {
            const log = JSON.parse(portContent) as Log;
            ns.print(`${getLogColor(log.type)}${log.type.toUpperCase()} | ${log.message}`);
        }
    }
}

const getLogColor = (type: LogType) => {
    switch (type) {
        case 'fatal':
        case 'error':
            return colors.red;
        case 'warning':
            return colors.yellow;
        case 'info':
            return colors.cyan;
        case 'success':
            return colors.green;
        default:
            return colors.standard;
    }
};

export const log = (ns: NS, message: string, type: LogType) =>
    writeLog(ns, { message: message, type: type });

function writeLog(ns: NS, log: Log): boolean {
    const loggerPort = ns.getPortHandle(loggerPortNumber);
    return loggerPort.tryWrite(JSON.stringify(log));
}

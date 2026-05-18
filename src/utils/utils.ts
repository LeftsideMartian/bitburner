import { NS } from '@ns';
import { NSMethods } from '../types';

export const disableLogging = (ns: NS, nsMethods: NSMethods[]) => {
    nsMethods.forEach(method => ns.disableLog(method as string));
    ns.clearLog();
};

import { GangMemberAscension, GangMemberInfo, NS } from '@ns';
import { Armory } from './Equipment';
import { Tasks } from './Tasks';
import { gangMemberPrefix, homeNode } from '/utils/constants';
import { ArgError } from '/errors/argError';
import { GangTaskStrategy } from '/types';

export class MyGang {
    members: GangMemberInfo[] = [];
    armory: Armory;
    tasks: Tasks;
    gangStrategy: GangTaskStrategy;
    purchaseLimit: number;

    targetAscensionMult = 1.5;
    targetTerritory = 0.7;
    targetClashWinChance = 0.55;
    targetMemberDefense = 600;

    constructor(ns: NS, purchaseLimit: number, strategy: GangTaskStrategy) {
        this.getMembers(ns);
        this.armory = new Armory(ns);
        this.tasks = new Tasks(ns);

        this.gangStrategy = strategy;
        this.purchaseLimit = purchaseLimit;
    }

    public update(ns: NS) {
        this.tryRecruit(ns);
        for (const member of this.members) {
            this.buyEquipment(ns, member);
            this.tryAscend(ns, member);
        }
        this.enableClash(ns);
        this.assignTasks(ns);
        this.getMembers(ns);
    }

    private tryRecruit(ns: NS) {
        const gang = ns.gang;

        if (!gang.canRecruitMember()) {
            return;
        }

        for (let i = 0; i < gang.getRecruitsAvailable(); i++) {
            const newMemberName = gangMemberPrefix + (this.members.length + 1);
            if (gang.recruitMember(newMemberName))
                this.members.push(gang.getMemberInformation(newMemberName));
            else throw new Error('Failed to recruit member.');
        }
    }

    private buyEquipment(ns: NS, member: GangMemberInfo) {
        const gang = ns.gang;

        const currentMoney = ns.getServerMoneyAvailable(homeNode);

        if (currentMoney < this.purchaseLimit) {
            return;
        }

        for (const items of Object.values(this.armory.equipment)) {
            for (const item of items) {
                if (item.cost <= currentMoney) {
                    gang.purchaseEquipment(member.name, item.name);
                    member = gang.getMemberInformation(member.name);
                } else {
                    break;
                }
            }
        }
    }

    private assignTasks(ns: NS) {
        const gang = ns.gang;

        const taskTypes = this.tasks.taskTypes;
        const gangInfo = gang.getGangInformation();
        const isMaxMembers = gang.respectForNextRecruit() === Infinity;

        for (const member of this.members) {
            // First assign training to those who need it
            if (member.def < this.targetMemberDefense) {
                gang.setMemberTask(member.name, 'Train Combat');
                continue;
            }

            // Reduce wanted level
            if (gangInfo.respect <= gangInfo.wantedLevel * 2) {
                gang.setMemberTask(member.name, taskTypes.wanted.name);
                continue;
            }

            // Territory next
            if (gangInfo.territory < this.targetTerritory && isMaxMembers) {
                gang.setMemberTask(member.name, taskTypes.territory.name);
                continue;
            }

            // Finally, either respect or income
            switch (this.gangStrategy) {
                case 'income':
                    gang.setMemberTask(
                        member.name,
                        taskTypes.income[taskTypes.income.length - 1].name
                    );
                    break;
                case 'respect':
                    gang.setMemberTask(member.name, taskTypes.respect.name);
                    break;
            }
        }
    }

    private tryAscend(ns: NS, member: GangMemberInfo) {
        const gang = ns.gang;

        const ascensionResult = gang.getAscensionResult(member.name);

        if (ascensionResult === undefined) {
            throw new ArgError(`Gang member ${member} does not exist.`);
        }

        if (this.shouldAscend(ascensionResult)) {
            gang.ascendMember(member.name);
            member = gang.getMemberInformation(member.name);
        }
    }

    private enableClash(ns: NS) {
        const gang = ns.gang;

        const otherGangs = gang.getAllGangInformation();

        let enableClash = true;

        for (const [gangName, gangInfo] of Object.entries(otherGangs)) {
            if (gangName === gang.getGangInformation().faction) continue;

            if (
                gangInfo.territory > 0 &&
                gang.getChanceToWinClash(gangName) < this.targetClashWinChance
            )
                enableClash = false;
        }

        gang.setTerritoryWarfare(enableClash);
    }

    private getMembers = (ns: NS) =>
        (this.members = ns.gang
            .getMemberNames()
            .map(member => ns.gang.getMemberInformation(member)));
    private shouldAscend = (ascensionResult: GangMemberAscension): boolean =>
        Object.entries(ascensionResult)
            .filter(([skill]) => skill === 'def')
            .every(([, factor]) => factor >= this.targetAscensionMult);
}

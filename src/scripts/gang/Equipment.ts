import { NS } from '@ns';
import { Equipment, EquipmentType, EquipmentTypes } from '/types';

export class Armory {
    equipment: EquipmentTypes;

    constructor(ns: NS) {
        const gang = ns.gang;

        const equipmentNames = gang.getEquipmentNames();

        const equipmentTypes: EquipmentTypes = {
            weapon: [],
            armor: [],
            vehicle: [],
            rootkit: [],
            augmentation: [],
        };

        for (const item of equipmentNames) {
            const type = gang.getEquipmentType(item).toLowerCase() as EquipmentType;
            const cost = gang.getEquipmentCost(item);
            const stats = gang.getEquipmentStats(item);

            const equipment: Equipment = {
                name: item,
                cost: cost,
                type: type, // Can potentially remove this
                stats: stats,
            };

            switch (type) {
                case 'weapon':
                    equipmentTypes.weapon.push(equipment);
                    break;
                case 'armor':
                    equipmentTypes.armor.push(equipment);
                    break;
                case 'vehicle':
                    equipmentTypes.vehicle.push(equipment);
                    break;
                case 'rootkit':
                    equipmentTypes.rootkit.push(equipment);
                    break;
                case 'augmentation':
                    equipmentTypes.augmentation.push(equipment);
                    break;
            }
        }

        // Sort based on cheapest first
        Object.values(equipmentTypes).forEach(equipmentTypes =>
            equipmentTypes.sort((eq1, eq2) => eq1.cost - eq2.cost)
        );

        this.equipment = equipmentTypes;
    }
}

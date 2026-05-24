import { NS } from '@ns';
import { ArgError } from '/errors/argError';
import { TaskTypes } from '/types';

export class Tasks {
    taskTypes: TaskTypes;

    constructor(ns: NS) {
        const gang = ns.gang;

        const tasks = gang.getTaskNames();

        const trainingTasks = [];
        const incomeTasks = [];
        let unassignedTask;
        let respectTask;
        let wantedTask;
        let territoryTask;

        for (const task of tasks) {
            const taskStats = gang.getTaskStats(task);
            const taskName = taskStats.name.toLowerCase();

            switch (taskName) {
                case 'unassigned':
                    unassignedTask = taskStats;
                    break;
                case 'terrorism':
                    respectTask = taskStats;
                    break;
                case 'vigilante justice':
                    wantedTask = taskStats;
                    break;
                case 'territory warfare':
                    territoryTask = taskStats;
                    break;
                default:
                    if (taskName.startsWith('train')) {
                        trainingTasks.push(taskStats);
                    } else {
                        incomeTasks.push(taskStats);
                    }
            }
        }

        // Check we found tasks
        if (trainingTasks.length === 0) {
            throw new ArgError('Could not find training tasks when fetching task types for Gang.');
        }

        if (incomeTasks.length === 0) {
            throw new ArgError('Could not find income tasks when fetching task types for Gang.');
        }

        if (unassignedTask === undefined) {
            throw new ArgError('Could not find unassigned task when fetching task types for Gang.');
        }

        if (respectTask === undefined) {
            throw new ArgError('Could not find respect task when fetching task types for Gang.');
        }

        if (wantedTask === undefined) {
            throw new ArgError('Could not find wanted task when fetching task types for Gang.');
        }

        this.taskTypes = {
            unassigned: unassignedTask,
            training: trainingTasks,
            respect: respectTask,
            wanted: wantedTask,
            income: incomeTasks,
            territory: territoryTask,
        } as TaskTypes;
    }
}

import type { RoadmapVersionStats } from "#/lib/roadmap/types";
import type { SeedTask } from "#/lib/seed/schemas";

export function emptyVersionStats(): RoadmapVersionStats {
	return {
		tasksTotal: 0,
		tasksDone: 0,
		tasksInProgress: 0,
		tasksBacklog: 0,
		deliverablesTotal: 0,
		deliverablesClosed: 0,
		workstreamsTotal: 0,
		commitsTracked: 0,
	};
}

export function statsFromTasks(
	tasks: SeedTask[],
	deliverablesTotal: number,
	deliverablesClosed: number,
	workstreamsTotal: number,
): RoadmapVersionStats {
	const commits = new Set(tasks.map((t) => t.source.commit.toLowerCase()));
	let tasksDone = 0;
	let tasksInProgress = 0;
	let tasksBacklog = 0;
	for (const task of tasks) {
		if (task.statusColumn === "Done") tasksDone += 1;
		else if (task.statusColumn === "In Progress") tasksInProgress += 1;
		else tasksBacklog += 1;
	}
	return {
		tasksTotal: tasks.length,
		tasksDone,
		tasksInProgress,
		tasksBacklog,
		deliverablesTotal,
		deliverablesClosed,
		workstreamsTotal,
		commitsTracked: commits.size,
	};
}

export function mergeStats(
	accum: RoadmapVersionStats,
	next: RoadmapVersionStats,
): RoadmapVersionStats {
	return {
		tasksTotal: accum.tasksTotal + next.tasksTotal,
		tasksDone: accum.tasksDone + next.tasksDone,
		tasksInProgress: accum.tasksInProgress + next.tasksInProgress,
		tasksBacklog: accum.tasksBacklog + next.tasksBacklog,
		deliverablesTotal: accum.deliverablesTotal + next.deliverablesTotal,
		deliverablesClosed: accum.deliverablesClosed + next.deliverablesClosed,
		workstreamsTotal: accum.workstreamsTotal + next.workstreamsTotal,
		commitsTracked: accum.commitsTracked + next.commitsTracked,
	};
}

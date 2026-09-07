import "@tanstack/react-start/server-only";

import { type BoardFilters, filterTasks } from "#/lib/github/filters";
import { DEFAULT_DELIVERY_VERSIONS } from "#/lib/github/roadmap-labels";
import type {
	PublicBug,
	PublicBugStats,
	RoadmapColumns,
	RoadmapTask,
} from "#/lib/github/types";
import { getIssuesDatabase } from "#/lib/storage/db";
import {
	trackerBugToPublicBug,
	trackerTaskToRoadmapTask,
} from "#/lib/tracker/mappers";
import {
	countTrackerBugs,
	listTrackerBugsWithLinks,
} from "#/lib/tracker/repositories/bugs-repository";
import { listTrackerTasksForBoard } from "#/lib/tracker/repositories/tasks-repository";
import { listTrackerVersions } from "#/lib/tracker/repositories/versions-repository";

export async function listAllRoadmapTasks(): Promise<RoadmapTask[]> {
	return listTrackerTasksForBoard().map(trackerTaskToRoadmapTask);
}

export async function listPublicBugs(): Promise<PublicBug[]> {
	return listTrackerBugsWithLinks("open").map(trackerBugToPublicBug);
}

export async function fetchPublicBugStats(): Promise<PublicBugStats> {
	return countTrackerBugs();
}

export async function listRoadmapBoard(filters: BoardFilters): Promise<{
	tasks: RoadmapTask[];
	columns: RoadmapColumns;
}> {
	const all = await listAllRoadmapTasks();
	const tasks = filterTasks(all, filters);
	const columns = buildRoadmapColumns(tasks);
	return { tasks, columns };
}

export function buildRoadmapColumns(tasks: RoadmapTask[]): RoadmapColumns {
	const columns: RoadmapColumns = {
		Backlog: [],
		"In Progress": [],
		Done: [],
	};
	for (const task of tasks) {
		columns[task.statusColumn].push(task);
	}
	for (const key of Object.keys(columns) as (keyof RoadmapColumns)[]) {
		columns[key].sort((a, b) => a.number - b.number);
	}
	return columns;
}

export async function listVersionLabels(): Promise<string[]> {
	const fromDb = listTrackerVersions().map((version) => version.id);
	return [...new Set([...DEFAULT_DELIVERY_VERSIONS, ...fromDb])].sort();
}

export function hasTrackerData(): boolean {
	const db = getIssuesDatabase();
	const versions =
		db
			.query<{ count: number }, []>(
				"SELECT COUNT(*) AS count FROM tracker_versions",
			)
			.get()?.count ?? 0;
	const tasks =
		db
			.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM tracker_tasks")
			.get()?.count ?? 0;
	const bugs =
		db
			.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM tracker_bugs")
			.get()?.count ?? 0;
	return versions > 0 || tasks > 0 || bugs > 0;
}

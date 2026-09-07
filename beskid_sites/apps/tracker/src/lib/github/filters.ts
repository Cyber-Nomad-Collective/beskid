import type { RoadmapTask } from "#/lib/github/types";

export interface BoardFilters {
	version: string;
	workstream?: string;
	domain?: string;
	area?: string;
	feature?: string;
}

export function taskMatchesFilters(
	task: RoadmapTask,
	filters: BoardFilters,
): boolean {
	if (task.version !== filters.version) return false;
	if (filters.workstream && task.workstream !== filters.workstream) {
		return false;
	}
	if (filters.domain && task.domain !== filters.domain) return false;
	if (filters.area && task.area !== filters.area) return false;
	if (filters.feature && task.feature !== filters.feature) return false;
	return true;
}

export function filterTasks(
	tasks: RoadmapTask[],
	filters: BoardFilters,
): RoadmapTask[] {
	return tasks.filter((task) => taskMatchesFilters(task, filters));
}

export interface WorkstreamSummary {
	slug: string;
	issueCount: number;
	doneCount: number;
	inProgressCount: number;
}

export function summarizeWorkstreams(
	tasks: RoadmapTask[],
	version: string,
): WorkstreamSummary[] {
	const byStream = new Map<string, WorkstreamSummary>();

	for (const task of tasks) {
		if (task.version !== version) continue;
		const slug = task.workstream ?? "_unassigned";
		const entry = byStream.get(slug) ?? {
			slug,
			issueCount: 0,
			doneCount: 0,
			inProgressCount: 0,
		};
		entry.issueCount += 1;
		if (task.statusColumn === "Done") entry.doneCount += 1;
		if (task.statusColumn === "In Progress") entry.inProgressCount += 1;
		byStream.set(slug, entry);
	}

	return [...byStream.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

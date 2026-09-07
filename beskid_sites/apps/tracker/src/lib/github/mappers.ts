import type { RoadmapTask } from "#/lib/github/types";

export function collectBoardMeta(tasks: RoadmapTask[]): {
	workstreams: string[];
	domains: string[];
	areas: string[];
	features: string[];
} {
	const workstreams = new Set<string>();
	const domains = new Set<string>();
	const areas = new Set<string>();
	const features = new Set<string>();

	for (const task of tasks) {
		if (task.workstream) workstreams.add(task.workstream);
		if (task.domain) domains.add(task.domain);
		if (task.area) areas.add(task.area);
		if (task.feature) features.add(task.feature);
	}

	return {
		workstreams: [...workstreams].sort(),
		domains: [...domains].sort(),
		areas: [...areas].sort(),
		features: [...features].sort(),
	};
}

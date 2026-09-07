import "@tanstack/react-start/server-only";

import type { Octokit } from "@octokit/rest";

import type { RoadmapTask } from "#/lib/github/types";
import {
	approveTaskSpec,
	type CreateRoadmapTaskInput,
	createRoadmapTask,
} from "#/lib/tracker/task-service";

export { approveTaskSpec };

export async function createRoadmapIssueForSession(
	_octokit: Octokit,
	input: CreateRoadmapTaskInput & {
		componentId: string;
		subcomponentId: string;
	},
): Promise<RoadmapTask> {
	const taskInput: CreateRoadmapTaskInput = {
		title: input.title,
		body: input.body,
		priority: input.priority,
		statusColumn: input.statusColumn,
		version: input.version,
		workstream: input.workstream,
		specRelations: input.specRelations,
		repoPaths: input.repoPaths,
	};

	return createRoadmapTask(taskInput);
}

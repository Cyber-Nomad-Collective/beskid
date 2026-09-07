import "@tanstack/react-start/server-only";

import type { Octokit } from "@octokit/rest";

import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import type { RoadmapTask } from "#/lib/github/types";
import { trackerTaskToRoadmapTask } from "#/lib/tracker/mappers";
import { getTrackerTask } from "#/lib/tracker/repositories/tasks-repository";
import {
	moveRoadmapTaskToColumn,
	type UpdateRoadmapTaskInput,
	updateRoadmapTask,
} from "#/lib/tracker/task-service";

export async function getRoadmapIssueForSession(
	_octokit: Octokit,
	versionId: string,
	taskId: string,
): Promise<RoadmapTask | null> {
	const task = getTrackerTask(versionId, taskId);
	return task ? trackerTaskToRoadmapTask({ ...task }) : null;
}

export async function moveIssueToColumnForSession(
	_octokit: Octokit,
	versionId: string,
	taskId: string,
	targetColumn: RoadmapColumnId,
	targetIndex: number,
): Promise<RoadmapTask> {
	return moveRoadmapTaskToColumn(
		{ versionId, taskId },
		targetColumn,
		targetIndex,
	);
}

export async function updateRoadmapIssueForSession(
	_octokit: Octokit,
	input: UpdateRoadmapTaskInput,
): Promise<RoadmapTask> {
	return updateRoadmapTask(input);
}

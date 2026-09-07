import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import type { RoadmapTask } from "#/lib/github/types";
import {
	getRoadmapIssueForSession,
	moveIssueToColumnForSession,
	updateRoadmapIssueForSession,
} from "#/lib/tracker/issue-write-service";
import { withOctokit } from "#/server/auth-guard.server";

export const getIssue = createServerFn({ method: "GET" })
	.inputValidator((data: { versionId: string; taskId: string }) => data)
	.handler(
		async ({ data }): Promise<RoadmapTask | null> =>
			withOctokit((octokit) =>
				getRoadmapIssueForSession(octokit, data.versionId, data.taskId),
			),
	);

const columnIdSchema = z.enum(["Backlog", "In Progress", "Done"]);

export const moveIssueColumn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			versionId: z.string().min(1),
			taskId: z.string().min(1),
			targetColumn: columnIdSchema,
			targetIndex: z.number().int().nonnegative(),
		}),
	)
	.handler(
		async ({ data }): Promise<RoadmapTask> =>
			withOctokit((octokit) =>
				moveIssueToColumnForSession(
					octokit,
					data.versionId,
					data.taskId,
					data.targetColumn as RoadmapColumnId,
					data.targetIndex,
				),
			),
	);

export const updateIssue = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			versionId: z.string().min(1),
			taskId: z.string().min(1),
			title: z.string().min(1).max(256).optional(),
			body: z.string().max(65536).optional(),
			priority: z.enum(["high", "medium", "low"]).optional(),
			specRelations: z
				.array(
					z.object({
						path: z.string(),
						href: z.string(),
						title: z.string().optional(),
						level: z.string().optional(),
						relation: z.enum([
							"implements",
							"depends-on",
							"tracks",
							"extends",
							"validates",
						]),
						required: z.boolean(),
					}),
				)
				.optional(),
			workstream: z.string().optional(),
			repoPaths: z.array(z.string().min(1).max(512)).max(32).optional(),
			subtasks: z
				.array(
					z.object({
						id: z.string(),
						text: z.string(),
						done: z.boolean(),
					}),
				)
				.optional(),
		}),
	)
	.handler(
		async ({ data }): Promise<RoadmapTask> =>
			withOctokit((octokit) => updateRoadmapIssueForSession(octokit, data)),
	);

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { BoardPayload } from "#/lib/github/types";
import { resolveAuthUser } from "#/server/auth.server";
import {
	canManageRoadmap,
	requireSession,
	withAuth,
} from "#/server/auth-guard.server";
import * as roadmapServer from "#/server/roadmap.server";

export const getBoard = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			version: z.string().min(1),
			workstream: z.string().optional(),
			domain: z.string().optional(),
			area: z.string().optional(),
			feature: z.string().optional(),
		}),
	)
	.handler(async ({ data }): Promise<BoardPayload> => {
		return withAuth(async (_octokit, user) => {
			const versions = await roadmapServer.listVersionLabelsFromStore();
			const { tasks, columns } =
				await roadmapServer.listRoadmapBoardFromStore(data);
			const all = await roadmapServer.listAllRoadmapTasksFromStore();
			const scoped = roadmapServer.collectBoardMeta(
				all.filter((t) => t.version === data.version),
			);
			roadmapServer.assertBoardFilters(
				data,
				scoped,
				roadmapServer.catalogWorkstreamSlugs(data.version),
			);
			const canManage = canManageRoadmap(user);

			return {
				meta: {
					versions,
					...scoped,
					canManage,
				},
				columns,
				tasks,
			};
		});
	});

export const getWorkstreamDashboard = createServerFn({ method: "GET" })
	.inputValidator(z.object({ version: z.string().min(1) }))
	.handler(async ({ data }) => {
		return withAuth(async (_octokit, user) => {
			const all = await roadmapServer.listAllRoadmapTasksFromStore();
			const canManage = canManageRoadmap(user);
			return {
				version: data.version,
				canManage,
				workstreams: roadmapServer.summarizeWorkstreams(all, data.version),
				versions: await roadmapServer.listVersionLabelsFromStore(),
			};
		});
	});

const columnIdSchema = z.enum(["Backlog", "In Progress", "Done"]);

export const createBoardIssue = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			title: z.string().min(1).max(256),
			body: z.string().max(65536).default(""),
			priority: z.enum(["high", "medium", "low"]),
			statusColumn: columnIdSchema,
			version: z.string().min(1),
			workstream: z.string().optional(),
			specRelations: z.array(
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
			),
			repoPaths: z.array(z.string().min(1).max(512)).max(32).default([]),
			componentId: z.string().min(1).max(64),
			subcomponentId: z.string().min(1).max(64),
		}),
	)
	.handler(async ({ data }) => {
		return withAuth((octokit) => roadmapServer.createRoadmapIssue(octokit, data));
	});

export const approveSpec = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({ versionId: z.string().min(1), taskId: z.string().min(1) }),
	)
	.handler(async ({ data }) => {
		return withAuth(async (_octokit, user) => {
			if (!canManageRoadmap(user)) {
				throw new Error("Only the repository owner can approve spec linkages");
			}
			return roadmapServer.approveTaskSpec(data.versionId, data.taskId);
		});
	});

export const getSessionInfo = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = await resolveAuthUser();
		if (!user) return { user: null, canManage: false };
		// canManageRoadmap needs the ShellUser groups, not the AuthUser shape.
		// resolveAuthUser already unsealed the session; re-derive canManage from
		// the same session via requireSession (returns the ShellUser with groups).
		let canManage = false;
		try {
			const shellUser = await requireSession();
			canManage = canManageRoadmap(shellUser);
		} catch {
			canManage = false;
		}
		return { user, canManage };
	},
);

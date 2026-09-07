import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { PublicBug, PublicBugStats } from "#/lib/github/types";
import { hasTrackerData } from "#/lib/tracker/read-service";
import { requireSession, withOctokit } from "#/server/auth-guard.server";
import * as publicBugsServer from "#/server/public-bugs.server";

export interface PublicBugsPayload {
	bugs: PublicBug[];
	rateLimited: boolean;
	cached: boolean;
	message?: string;
}

export interface PublicBugStatsPayload extends PublicBugStats {
	rateLimited: boolean;
	cached: boolean;
	message?: string;
}

export const listPublicBugsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<PublicBugsPayload> => {
		try {
			const bugs = await publicBugsServer.listPublicBugsFromStore();
			return {
				bugs,
				rateLimited: false,
				cached: hasTrackerData(),
				message: publicBugsServer.syncStatusMessage(),
			};
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to load bugs from database";
			return {
				bugs: [],
				rateLimited: true,
				cached: false,
				message,
			};
		}
	},
);

export const createPublicBugFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			title: z.string().min(1).max(256),
			body: z.string().max(65536).default(""),
			componentId: z.string().min(1).max(64),
			subcomponentId: z.string().min(1).max(64),
			attachments: z
				.array(
					z.object({
						name: z.string().min(1).max(256),
						contentBase64: z.string().min(1).max(3_000_000),
					}),
				)
				.max(8)
				.optional(),
		}),
	)
	.handler(async ({ data }) =>
		withOctokit((octokit) =>
			publicBugsServer.createPublicBugIssue(octokit, data),
		),
	);

export const getPublicBugStatsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<PublicBugStatsPayload> => {
		try {
			const stats = await publicBugsServer.fetchPublicBugStatsFromStore();
			return {
				...stats,
				rateLimited: false,
				cached: hasTrackerData(),
				message: publicBugsServer.syncStatusMessage(),
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to load bug stats";
			return {
				open: 0,
				closed: 0,
				rateLimited: true,
				cached: false,
				message,
			};
		}
	},
);

export const syncIssuesFn = createServerFn({ method: "POST" }).handler(
	async () => {
		await requireSession();
		return publicBugsServer.triggerGithubSyncExport();
	},
);

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	createSyncOctokit,
	hasGithubSyncCredentials,
} from "#/lib/sync/sync-octokit";
import type { GithubExportResult } from "#/lib/tracker/github-export-service";
import { drainGithubSyncOutbox } from "#/lib/tracker/process-outbox";
import {
	getTrackerSyncSettings,
	type TrackerSyncSettings,
	type UpdateTrackerSyncSettingsInput,
	updateTrackerSyncSettings,
} from "#/lib/tracker/sync-settings";
import { requireMaintainer } from "#/server/auth-guard.server";

export const getSyncSettingsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<TrackerSyncSettings> => {
		await requireMaintainer();
		return getTrackerSyncSettings();
	},
);

export const updateSyncSettingsFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			enabled: z.boolean().optional(),
			exportBugs: z.boolean().optional(),
		}),
	)
	.handler(async ({ data }): Promise<TrackerSyncSettings> => {
		await requireMaintainer();
		const input: UpdateTrackerSyncSettingsInput = {
			enabled: data.enabled,
			exportBugs: data.exportBugs,
		};
		return updateTrackerSyncSettings(input);
	});

export const triggerGithubExportFn = createServerFn({ method: "POST" }).handler(
	async (): Promise<GithubExportResult> => {
		await requireMaintainer();
		if (!hasGithubSyncCredentials()) {
			throw new Error(
				"Set GITHUB_SYNC_TOKEN or GITHUB_PUBLIC_READ_TOKEN to export bugs to GitHub",
			);
		}
		return drainGithubSyncOutbox(createSyncOctokit());
	},
);

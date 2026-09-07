import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { TrackerSyncSettings } from "#/lib/tracker/sync-settings";
import { requireMaintainer, withOctokit } from "#/server/auth-guard.server";
import type { GithubWebhookSecretSource } from "#/server/github-sync-settings.server";
import * as githubSyncServer from "#/server/github-sync-settings.server";

export interface GithubWebhookSettingsPayload {
	webhookUrl: string;
	publicOrigin: string;
	repoFullName: string;
	githubNewWebhookUrl: string;
	githubWebhooksUrl: string;
	secretConfigured: boolean;
	secretSource: GithubWebhookSecretSource;
	secretLockedByEnv: boolean;
	lastWebhookAt: string | null;
	lastWebhookAction: string | null;
	syncDisabled: boolean;
	syncSettings: TrackerSyncSettings;
}

export interface ProvisionGithubWebhookPayload {
	action: "created" | "updated";
	hookId: number;
	adminUrl: string;
	payloadUrl: string;
}

export const getGithubWebhookSettingsFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<GithubWebhookSettingsPayload> => {
	await requireMaintainer();
	return githubSyncServer.buildGithubWebhookSettings();
});

export const updateGithubWebhookSettingsFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			publicOrigin: z.string().url().optional(),
			webhookSecret: z
				.union([z.string().min(8).max(256), z.literal("")])
				.optional(),
		}),
	)
	.handler(async ({ data }): Promise<GithubWebhookSettingsPayload> => {
		await requireMaintainer();

		if (githubSyncServer.getGithubWebhookSecretFromEnv()) {
			throw new Error(
				"Webhook secret is set via GITHUB_WEBHOOK_SECRET in the environment and cannot be changed here",
			);
		}

		if (data.publicOrigin) {
			githubSyncServer.setTrackerPublicOrigin(data.publicOrigin);
		}

		if (data.webhookSecret !== undefined) {
			if (data.webhookSecret === "") {
				githubSyncServer.clearGithubWebhookSecretInDatabase();
			} else {
				githubSyncServer.setGithubWebhookSecretInDatabase(data.webhookSecret);
			}
		}

		return githubSyncServer.buildGithubWebhookSettings();
	});

export const provisionGithubWebhookFn = createServerFn({
	method: "POST",
}).handler(async (): Promise<ProvisionGithubWebhookPayload> => {
	await requireMaintainer();

	return withOctokit(async (octokit) =>
		githubSyncServer.provisionRepositoryIssuesWebhook(octokit),
	);
});

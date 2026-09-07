import {
	clearGithubWebhookSecretInDatabase,
	getGithubWebhookSecretFromEnv,
	getGithubWebhookSecretSource,
	githubRepoFullName,
	githubRepositoryNewWebhookUrl,
	githubRepositoryWebhooksUrl,
	githubWebhookUrl,
	isGithubSyncDisabled,
	isGithubWebhookConfigured,
	readGithubWebhookDeliveryMeta,
	resolveTrackerPublicOrigin,
	setGithubWebhookSecretInDatabase,
	setTrackerPublicOrigin,
} from "#/lib/sync/github-webhook-config";
import { provisionRepositoryIssuesWebhook } from "#/lib/sync/github-webhook-provision";
import {
	getTrackerSyncSettings,
	type TrackerSyncSettings,
} from "#/lib/tracker/sync-settings";

export type GithubWebhookSecretSource = ReturnType<
	typeof getGithubWebhookSecretSource
>;

export type { TrackerSyncSettings };

export {
	clearGithubWebhookSecretInDatabase,
	getGithubWebhookSecretFromEnv,
	getTrackerSyncSettings,
	provisionRepositoryIssuesWebhook,
	setGithubWebhookSecretInDatabase,
	setTrackerPublicOrigin,
};

export function buildGithubWebhookSettings() {
	const delivery = readGithubWebhookDeliveryMeta();
	const syncSettings = getTrackerSyncSettings();

	return {
		webhookUrl: githubWebhookUrl(),
		publicOrigin: resolveTrackerPublicOrigin(),
		repoFullName: githubRepoFullName(),
		githubNewWebhookUrl: githubRepositoryNewWebhookUrl(),
		githubWebhooksUrl: githubRepositoryWebhooksUrl(),
		secretConfigured: isGithubWebhookConfigured(),
		secretSource: getGithubWebhookSecretSource(),
		secretLockedByEnv: Boolean(getGithubWebhookSecretFromEnv()),
		lastWebhookAt: delivery.lastAt,
		lastWebhookAction: delivery.lastAction,
		syncDisabled: isGithubSyncDisabled(),
		syncSettings,
	};
}

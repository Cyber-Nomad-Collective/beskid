import {
	fetchPublicBugStatsFromStore,
	listPublicBugsFromStore,
} from "#/lib/issues/read-service";
import {
	createSyncOctokit,
	hasGithubSyncCredentials,
} from "#/lib/sync/sync-octokit";
import { createPublicBugForSession } from "#/lib/tracker/bug-write-service";
import { drainGithubSyncOutbox } from "#/lib/tracker/process-outbox";
import { hasTrackerData } from "#/lib/tracker/read-service";
import { getTrackerSyncSettings } from "#/lib/tracker/sync-settings";

export {
	createPublicBugForSession as createPublicBugIssue,
	fetchPublicBugStatsFromStore,
	listPublicBugsFromStore,
};

export async function triggerGithubSyncExport() {
	if (!hasGithubSyncCredentials()) {
		throw new Error(
			"Set GITHUB_SYNC_TOKEN or GITHUB_PUBLIC_READ_TOKEN to export to GitHub",
		);
	}
	return drainGithubSyncOutbox(createSyncOctokit());
}

export function syncStatusMessage(): string | undefined {
	if (!hasTrackerData()) {
		return "Tracker database is empty. Import seed JSON from Settings → Sync actions.";
	}

	const settings = getTrackerSyncSettings();
	if (settings.outboxDepth > 0) {
		return `${settings.outboxDepth} change(s) waiting to export to GitHub.`;
	}

	return undefined;
}

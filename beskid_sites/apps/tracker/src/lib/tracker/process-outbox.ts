import "@tanstack/react-start/server-only";

import type { Octokit } from "@octokit/rest";

import { createSyncOctokit } from "#/lib/sync/sync-octokit";
import {
	type GithubExportResult,
	processGithubSyncOutboxEntries,
} from "#/lib/tracker/github-export-service";

export type { GithubExportResult };

export async function drainGithubSyncOutbox(
	octokit?: Octokit,
	limit = 100,
): Promise<GithubExportResult> {
	const client = octokit ?? createSyncOctokit();
	return processGithubSyncOutboxEntries(client, limit);
}

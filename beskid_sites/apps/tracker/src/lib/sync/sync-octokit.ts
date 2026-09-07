import "@tanstack/react-start/server-only";

import type { Octokit } from "@octokit/rest";

import { env } from "#/env.server";
import { createOctokit, createPublicReadOctokit } from "#/lib/github/octokit";

export function hasGithubSyncCredentials(): boolean {
	return Boolean(
		process.env.GITHUB_SYNC_TOKEN?.trim() || env.GITHUB_PUBLIC_READ_TOKEN,
	);
}

/** PAT used only for bootstrap / manual full pull (not per-user reads). */
export function createSyncOctokit(): Octokit {
	const token =
		process.env.GITHUB_SYNC_TOKEN?.trim() || env.GITHUB_PUBLIC_READ_TOKEN;
	return token ? createOctokit(token) : createPublicReadOctokit();
}

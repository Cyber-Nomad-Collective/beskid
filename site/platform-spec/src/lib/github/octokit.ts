import "@tanstack/react-start/server-only";

import { Octokit } from "@octokit/rest";

import { resolveNormativeRepoConfig } from "#/lib/spec-repo-settings.server";

export function createOctokit(accessToken: string): Octokit {
	return new Octokit({ auth: accessToken });
}

export function repoParams() {
	const config = resolveNormativeRepoConfig();
	return {
		owner: config.owner,
		repo: config.repo,
	};
}

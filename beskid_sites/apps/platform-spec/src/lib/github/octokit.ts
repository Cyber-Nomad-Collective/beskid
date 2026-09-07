import "@tanstack/react-start/server-only";

import { Octokit } from "@octokit/rest";

import { env } from "#/env.server";

export function createOctokit(accessToken: string): Octokit {
	return new Octokit({ auth: accessToken });
}

export function repoParams() {
	return {
		owner: env.GITHUB_REPO_OWNER,
		repo: env.GITHUB_REPO_NAME,
	};
}

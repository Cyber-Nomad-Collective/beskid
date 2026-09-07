import "@tanstack/react-start/server-only";

import { Octokit } from "@octokit/rest";

import { env } from "#/env.server";

export function createOctokit(accessToken: string): Octokit {
	return new Octokit({ auth: accessToken });
}

/** Public issue reads (optional PAT; otherwise unauthenticated, rate-limited). */
export function createPublicReadOctokit(): Octokit {
	const token = env.GITHUB_PUBLIC_READ_TOKEN;
	return token ? new Octokit({ auth: token }) : new Octokit();
}

export function repoParams() {
	return {
		owner: env.GITHUB_REPO_OWNER,
		repo: env.GITHUB_REPO_NAME,
	};
}

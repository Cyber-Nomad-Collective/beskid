import "@tanstack/react-start/server-only";

import type { Octokit } from "@octokit/rest";

import { createPublicReadOctokit } from "#/lib/github/octokit";

/**
 * Public GitHub read Octokit.
 *
 * The old tracker preferred the auth-hub proxy for signed-in users (per-user
 * token, higher rate limit). Under Authelia there is no per-user GitHub
 * token, so all public reads use the optional `GITHUB_PUBLIC_READ_TOKEN` PAT
 * (or unauthenticated, rate-limited). This is only used for read-only public
 * issue fetches; the SQLite store remains the source of truth.
 */
export async function createGitHubReadOctokit(): Promise<Octokit> {
	return createPublicReadOctokit();
}

import { githubProxyBaseUrl } from "@beskid/auth-client";
import { Octokit } from "@octokit/rest";

import "@tanstack/react-start/server-only";

import { getAuthHubUrl } from "#/lib/auth/hub-settings.server";

export function createHubOctokit(hubUserToken: string): Octokit {
	const hubUrl = getAuthHubUrl();
	if (!hubUrl) {
		throw new Error("Auth hub URL is not configured");
	}
	return new Octokit({
		auth: hubUserToken,
		baseUrl: githubProxyBaseUrl(hubUrl),
	});
}

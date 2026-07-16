import type { ResolvedOAuthConfig } from "#/server/config-store";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

export interface GitHubUser {
	id: number;
	login: string;
	avatar_url: string;
	name: string | null;
}

export function buildGitHubAuthorizeUrl(
	cfg: ResolvedOAuthConfig,
	state: string,
): string {
	const url = new URL(GITHUB_AUTHORIZE_URL);
	url.searchParams.set("client_id", cfg.clientId);
	url.searchParams.set("redirect_uri", cfg.callbackUrl);
	url.searchParams.set("scope", "read:user repo");
	url.searchParams.set("state", state);
	return url.toString();
}

export async function exchangeGitHubCode(
	cfg: ResolvedOAuthConfig,
	code: string,
): Promise<string> {
	const response = await fetch(GITHUB_TOKEN_URL, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_id: cfg.clientId,
			client_secret: cfg.clientSecret,
			code,
			redirect_uri: cfg.callbackUrl,
		}),
	});

	if (!response.ok) {
		throw new Error(`GitHub token exchange failed (${response.status})`);
	}

	const payload = (await response.json()) as {
		access_token?: string;
		error?: string;
		error_description?: string;
	};

	if (!payload.access_token) {
		throw new Error(
			payload.error_description ?? payload.error ?? "Missing access token",
		);
	}

	return payload.access_token;
}

export async function fetchGitHubUser(
	accessToken: string,
): Promise<GitHubUser> {
	const response = await fetch(GITHUB_USER_URL, {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${accessToken}`,
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});

	if (!response.ok) {
		throw new Error(`GitHub user fetch failed (${response.status})`);
	}

	const user = (await response.json()) as GitHubUser;
	if (!Number.isSafeInteger(user.id) || user.id <= 0 || !user.login) {
		throw new Error("Missing GitHub user identity");
	}
	return user;
}

import type { AuthAppId } from "@beskid/auth-client";

import { env } from "#/env.server";
import type {
	AuthConfigFile,
	ResolvedOAuthConfig,
} from "#/server/config-store-types";
import {
	ensureLegacyConfigImported,
	getEncryptedHubSetting,
	getHubSetting,
	setEncryptedHubSetting,
	setHubSetting,
} from "#/server/db/index";
import {
	getHandoffSecretForApp,
	listEnabledApps,
} from "#/server/repositories/paired-apps";

export type {
	AuthConfigFile,
	ResolvedOAuthConfig,
	StoredAuthApp,
} from "#/server/config-store-types";

async function ensureDb(): Promise<void> {
	await ensureLegacyConfigImported();
}

export async function readAuthConfig(): Promise<AuthConfigFile> {
	await ensureDb();
	const adminRaw = getHubSetting("admin_github_logins");
	return {
		onboarded: getHubSetting("onboarded") === "true",
		githubClientId: getHubSetting("github_client_id") ?? undefined,
		githubClientSecret:
			getEncryptedHubSetting("github_client_secret") ?? undefined,
		githubOAuthCallbackUrl:
			getHubSetting("github_oauth_callback_url") ?? undefined,
		adminGitHubLogins: adminRaw ? (JSON.parse(adminRaw) as string[]) : [],
		apps: [],
	};
}

export async function writeAuthConfig(config: AuthConfigFile): Promise<void> {
	await ensureDb();
	setHubSetting("onboarded", config.onboarded ? "true" : "false");
	if (config.githubClientId) {
		setHubSetting("github_client_id", config.githubClientId);
	}
	if (config.githubClientSecret) {
		setEncryptedHubSetting("github_client_secret", config.githubClientSecret);
	}
	if (config.githubOAuthCallbackUrl) {
		setHubSetting("github_oauth_callback_url", config.githubOAuthCallbackUrl);
	}
	if (config.adminGitHubLogins.length > 0) {
		setHubSetting(
			"admin_github_logins",
			JSON.stringify(
				config.adminGitHubLogins.map((entry) => entry.trim().toLowerCase()),
			),
		);
	}
}

export async function resolveOAuthConfig(): Promise<ResolvedOAuthConfig> {
	await ensureDb();
	const clientId =
		env.GITHUB_CLIENT_ID?.trim() ||
		getHubSetting("github_client_id")?.trim() ||
		"";
	const clientSecret =
		env.GITHUB_CLIENT_SECRET?.trim() ||
		getEncryptedHubSetting("github_client_secret")?.trim() ||
		"";
	const callbackUrl =
		env.GITHUB_OAUTH_CALLBACK_URL?.trim() ||
		getHubSetting("github_oauth_callback_url")?.trim() ||
		`${env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "")}/callback`;

	let source: ResolvedOAuthConfig["source"] = "none";
	if (clientId && clientSecret && callbackUrl) {
		source = env.GITHUB_CLIENT_ID?.trim() ? "env" : "db";
	}

	return { clientId, clientSecret, callbackUrl, source };
}

export async function isOAuthConfigured(): Promise<boolean> {
	const cfg = await resolveOAuthConfig();
	return Boolean(cfg.clientId && cfg.clientSecret && cfg.callbackUrl);
}

export async function isOnboarded(): Promise<boolean> {
	await ensureDb();
	if (getHubSetting("onboarded") === "true") return true;
	return isOAuthConfigured();
}

export { listEnabledApps };

export async function getAppById(appId: string) {
	const apps = await listEnabledApps();
	return apps.find((app) => app.id === appId) ?? null;
}

export async function isAdminLogin(login: string): Promise<boolean> {
	await ensureDb();
	const adminRaw = getHubSetting("admin_github_logins");
	if (!adminRaw) return false;
	const logins = JSON.parse(adminRaw) as string[];
	const normalized = login.trim().toLowerCase();
	return logins.some((entry) => entry.trim().toLowerCase() === normalized);
}

export function verifySetupToken(token: string | null | undefined): boolean {
	const expected = env.AUTH_SETUP_TOKEN?.trim();
	if (!expected) return false;
	return token === expected;
}

export type { AuthAppId };

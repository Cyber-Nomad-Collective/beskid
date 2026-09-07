import "@tanstack/react-start/server-only";

import { env } from "#/env.server";
import {
	APP_SETTING_KEYS,
	deleteAppSetting,
	getAppSetting,
	setAppSetting,
} from "#/lib/storage/app-settings-repository";

export type GithubWebhookSecretSource = "env" | "database" | "none";

export function getGithubWebhookSecretFromEnv(): string | null {
	return process.env.GITHUB_WEBHOOK_SECRET?.trim() || null;
}

export function getGithubWebhookSecretFromDatabase(): string | null {
	return getAppSetting(APP_SETTING_KEYS.githubWebhookSecret)?.trim() || null;
}

/** Active webhook secret: environment variable overrides database. */
export function getGithubWebhookSecret(): string | null {
	return getGithubWebhookSecretFromEnv() ?? getGithubWebhookSecretFromDatabase();
}

export function getGithubWebhookSecretSource(): GithubWebhookSecretSource {
	if (getGithubWebhookSecretFromEnv()) return "env";
	if (getGithubWebhookSecretFromDatabase()) return "database";
	return "none";
}

export function isGithubWebhookConfigured(): boolean {
	return Boolean(getGithubWebhookSecret());
}

export function isGithubSyncDisabled(): boolean {
	return process.env.ISSUES_SYNC_DISABLED === "1";
}

export function resolveTrackerPublicOrigin(): string {
	const envOrigin = process.env.TRACKER_PUBLIC_URL?.trim();
	if (envOrigin) return envOrigin.replace(/\/$/, "");

	const stored = getAppSetting(APP_SETTING_KEYS.trackerPublicOrigin)?.trim();
	if (stored) return stored.replace(/\/$/, "");

	const callback = process.env.GITHUB_OAUTH_CALLBACK_URL;
	if (!callback) return "http://localhost:3000";
	try {
		return new URL(callback).origin;
	} catch {
		return "http://localhost:3000";
	}
}

export function githubWebhookUrl(): string {
	return `${resolveTrackerPublicOrigin()}/api/webhooks/github`;
}

export function githubRepoFullName(): string {
	return `${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}`;
}

/** GitHub UI: add a new repository webhook (manual form; payload URL must be pasted). */
export function githubRepositoryNewWebhookUrl(): string {
	return `https://github.com/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}/settings/hooks/new`;
}

/** GitHub UI: list existing repository webhooks. */
export function githubRepositoryWebhooksUrl(): string {
	return `https://github.com/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}/settings/hooks`;
}

/** GitHub UI: edit a specific repository webhook. */
export function githubRepositoryWebhookAdminUrl(hookId: number): string {
	return `https://github.com/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}/settings/hooks/${hookId}`;
}

export function setTrackerPublicOrigin(origin: string): void {
	setAppSetting(APP_SETTING_KEYS.trackerPublicOrigin, origin.replace(/\/$/, ""));
}

export function setGithubWebhookSecretInDatabase(secret: string): void {
	setAppSetting(APP_SETTING_KEYS.githubWebhookSecret, secret);
}

export function clearGithubWebhookSecretInDatabase(): void {
	deleteAppSetting(APP_SETTING_KEYS.githubWebhookSecret);
}

export function recordGithubWebhookDelivery(action: string): void {
	const now = new Date().toISOString();
	setAppSetting(APP_SETTING_KEYS.githubWebhookLastAt, now);
	setAppSetting(APP_SETTING_KEYS.githubWebhookLastAction, action);
}

export function readGithubWebhookDeliveryMeta(): {
	lastAt: string | null;
	lastAction: string | null;
} {
	return {
		lastAt: getAppSetting(APP_SETTING_KEYS.githubWebhookLastAt),
		lastAction: getAppSetting(APP_SETTING_KEYS.githubWebhookLastAction),
	};
}

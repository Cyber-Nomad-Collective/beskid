import { mkdirSync } from "node:fs";
import fs from "node:fs/promises";

import type { AuthConfigFile } from "#/server/config-store-types";
import { decryptSecret, encryptSecret, hashSecret } from "#/server/crypto";
import { authDataDir, authDbPath, legacyConfigPath } from "#/server/db/paths";
import { migrateAuthSchema } from "#/server/db/schema";
import { type Database, openSqlite } from "#/server/db/sqlite";

let dbInstance: Database | null = null;
let legacyImported = false;

export function getAuthDatabase(): Database {
	if (!dbInstance) {
		mkdirSync(authDataDir(), { recursive: true });
		dbInstance = openSqlite(authDbPath());
		migrateAuthSchema(dbInstance);
	}
	return dbInstance;
}

export async function ensureLegacyConfigImported(): Promise<void> {
	if (legacyImported) return;
	legacyImported = true;

	const db = getAuthDatabase();
	const row = db
		.query<{ value: string }, []>(
			"SELECT value FROM hub_settings WHERE key = 'onboarded'",
		)
		.get();
	if (row?.value === "true") return;

	let file: AuthConfigFile | null = null;
	try {
		const raw = await fs.readFile(legacyConfigPath(), "utf8");
		file = JSON.parse(raw) as AuthConfigFile;
	} catch {
		return;
	}

	const now = new Date().toISOString();
	const set = db.prepare(
		"INSERT OR REPLACE INTO hub_settings (key, value, updated_at) VALUES (?, ?, ?)",
	);

	if (file.onboarded) {
		set.run("onboarded", "true", now);
	}
	if (file.githubClientId) {
		set.run("github_client_id", file.githubClientId, now);
	}
	if (file.githubClientSecret) {
		try {
			set.run("github_client_secret", encryptSecret(file.githubClientSecret), now);
		} catch {
			set.run("github_client_secret", file.githubClientSecret, now);
		}
	}
	if (file.githubOAuthCallbackUrl) {
		set.run("github_oauth_callback_url", file.githubOAuthCallbackUrl, now);
	}
	if (file.adminGitHubLogins.length > 0) {
		set.run("admin_github_logins", JSON.stringify(file.adminGitHubLogins), now);
	}

	for (const app of file.apps) {
		if (!app.enabled) continue;
		const legacySecret = process.env.AUTH_HUB_SECRET?.trim();
		if (!legacySecret || legacySecret.length < 32) continue;
		db
			.prepare(
				`INSERT OR REPLACE INTO paired_apps
			 (id, public_url, handoff_secret_hash, status, paired_at, approved_by_login)
			 VALUES (?, ?, ?, 'active', ?, 'legacy-import')`,
			)
			.run(
				app.id,
				app.publicUrl.replace(/\/$/, ""),
				hashSecret(legacySecret),
				now,
			);
	}
}

export function getHubSetting(key: string): string | null {
	const row = getAuthDatabase()
		.query<{ value: string }, [string]>(
			"SELECT value FROM hub_settings WHERE key = ?",
		)
		.get(key);
	return row?.value ?? null;
}

export function setHubSetting(key: string, value: string): void {
	getAuthDatabase()
		.prepare(
			"INSERT OR REPLACE INTO hub_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
		)
		.run(key, value);
}

export function getEncryptedHubSetting(key: string): string | null {
	const stored = getHubSetting(key);
	if (!stored) return null;
	try {
		return decryptSecret(stored);
	} catch {
		return stored;
	}
}

export function setEncryptedHubSetting(key: string, plaintext: string): void {
	setHubSetting(key, encryptSecret(plaintext));
}

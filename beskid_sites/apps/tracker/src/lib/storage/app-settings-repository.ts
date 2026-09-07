import "@tanstack/react-start/server-only";

import { getIssuesDatabase } from "#/lib/storage/db";

export const APP_SETTING_KEYS = {
	githubWebhookSecret: "github_webhook_secret",
	trackerPublicOrigin: "tracker_public_origin",
	githubWebhookLastAt: "github_webhook_last_at",
	githubWebhookLastAction: "github_webhook_last_action",
} as const;

export function getAppSetting(key: string): string | null {
	const db = getIssuesDatabase();
	const row = db
		.query<{ value: string }, [string]>(
			"SELECT value FROM app_settings WHERE key = ?",
		)
		.get(key);
	return row?.value ?? null;
}

export function setAppSetting(key: string, value: string): void {
	const db = getIssuesDatabase();
	const now = new Date().toISOString();
	db.run(
		`
		INSERT INTO app_settings (key, value, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(key) DO UPDATE SET
			value = excluded.value,
			updated_at = excluded.updated_at
		`,
		[key, value, now],
	);
}

export function deleteAppSetting(key: string): void {
	const db = getIssuesDatabase();
	db.run("DELETE FROM app_settings WHERE key = ?", [key]);
}

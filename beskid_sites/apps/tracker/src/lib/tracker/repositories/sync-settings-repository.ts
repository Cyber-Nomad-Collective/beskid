import "@tanstack/react-start/server-only";

import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import type { SyncSettingRow } from "#/lib/tracker/types";

export const SYNC_SETTING_KEYS = {
	enabled: "sync.enabled",
	exportBugs: "sync.export_bugs",
	lastExportAt: "sync.last_export_at",
	lastInboundAt: "sync.last_inbound_at",
} as const;

function nowIso(): string {
	return new Date().toISOString();
}

export function getSyncSetting(key: string, db?: Database): string | null {
	const database = db ?? getIssuesDatabase();
	const row = database
		.query<Pick<SyncSettingRow, "value">, [string]>(
			"SELECT value FROM sync_settings WHERE key = ?",
		)
		.get(key);
	return row?.value ?? null;
}

export function setSyncSetting(
	key: string,
	value: string,
	db?: Database,
): void {
	const database = db ?? getIssuesDatabase();
	const now = nowIso();
	database.run(
		`
		INSERT INTO sync_settings (key, value, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(key) DO UPDATE SET
			value = excluded.value,
			updated_at = excluded.updated_at
		`,
		[key, value, now],
	);
}

export function deleteSyncSetting(key: string, db?: Database): void {
	const database = db ?? getIssuesDatabase();
	database.run("DELETE FROM sync_settings WHERE key = ?", [key]);
}

export function listSyncSettings(db?: Database): SyncSettingRow[] {
	const database = db ?? getIssuesDatabase();
	return database
		.query<SyncSettingRow, []>(
			"SELECT key, value, updated_at FROM sync_settings ORDER BY key ASC",
		)
		.all();
}

export function getSyncSettingBoolean(
	key: string,
	defaultValue = false,
	db?: Database,
): boolean {
	const raw = getSyncSetting(key, db);
	if (raw === null) return defaultValue;
	const normalized = raw.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}

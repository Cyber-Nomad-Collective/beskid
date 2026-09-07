import "@tanstack/react-start/server-only";

import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import { countGithubSyncOutbox } from "#/lib/tracker/repositories/outbox-repository";
import {
	getSyncSetting,
	getSyncSettingBoolean,
	SYNC_SETTING_KEYS,
	setSyncSetting,
} from "#/lib/tracker/repositories/sync-settings-repository";

export interface TrackerSyncSettings {
	enabled: boolean;
	exportBugs: boolean;
	lastExportAt: string | null;
	lastInboundAt: string | null;
	outboxDepth: number;
}

export interface UpdateTrackerSyncSettingsInput {
	enabled?: boolean;
	exportBugs?: boolean;
}

export function getTrackerSyncSettings(db?: Database): TrackerSyncSettings {
	const database = db ?? getIssuesDatabase();
	return {
		enabled: getSyncSettingBoolean(SYNC_SETTING_KEYS.enabled, false, database),
		exportBugs: getSyncSettingBoolean(
			SYNC_SETTING_KEYS.exportBugs,
			true,
			database,
		),
		lastExportAt:
			getSyncSetting(SYNC_SETTING_KEYS.lastExportAt, database) ?? null,
		lastInboundAt:
			getSyncSetting(SYNC_SETTING_KEYS.lastInboundAt, database) ?? null,
		outboxDepth: countGithubSyncOutbox(database),
	};
}

export function updateTrackerSyncSettings(
	input: UpdateTrackerSyncSettingsInput,
	db?: Database,
): TrackerSyncSettings {
	const database = db ?? getIssuesDatabase();

	if (input.enabled !== undefined) {
		setSyncSetting(
			SYNC_SETTING_KEYS.enabled,
			input.enabled ? "true" : "false",
			database,
		);
	}

	if (input.exportBugs !== undefined) {
		setSyncSetting(
			SYNC_SETTING_KEYS.exportBugs,
			input.exportBugs ? "true" : "false",
			database,
		);
	}

	return getTrackerSyncSettings(database);
}

export function markTrackerExportCompleted(db?: Database): void {
	const database = db ?? getIssuesDatabase();
	setSyncSetting(
		SYNC_SETTING_KEYS.lastExportAt,
		new Date().toISOString(),
		database,
	);
}

export function markTrackerInboundCompleted(db?: Database): void {
	const database = db ?? getIssuesDatabase();
	setSyncSetting(
		SYNC_SETTING_KEYS.lastInboundAt,
		new Date().toISOString(),
		database,
	);
}

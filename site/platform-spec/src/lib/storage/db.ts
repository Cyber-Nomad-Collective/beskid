import "@tanstack/react-start/server-only";

import {
	ensurePlatformSpecDataDir,
	settingsDbPath,
} from "#/lib/storage/paths";
import { migrateSchema } from "#/lib/storage/schema";
import { type Database, openSqlite } from "#/lib/storage/sqlite";

let dbInstance: Database | null = null;

export function getSettingsDatabase(): Database {
	if (!dbInstance) {
		ensurePlatformSpecDataDir();
		dbInstance = openSqlite(settingsDbPath());
		migrateSchema(dbInstance);
	}
	return dbInstance;
}

/** Test helper — closes the singleton between cases. */
export function closeSettingsDatabase(): void {
	dbInstance?.close();
	dbInstance = null;
}

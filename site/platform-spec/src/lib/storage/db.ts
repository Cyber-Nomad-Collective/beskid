import "@tanstack/react-start/server-only";

import { Database } from "bun:sqlite";

import {
	ensurePlatformSpecDataDir,
	settingsDbPath,
} from "#/lib/storage/paths";
import { migrateSchema } from "#/lib/storage/schema";

let dbInstance: Database | null = null;

export function getSettingsDatabase(): Database {
	if (!dbInstance) {
		ensurePlatformSpecDataDir();
		dbInstance = new Database(settingsDbPath(), { create: true });
		migrateSchema(dbInstance);
	}
	return dbInstance;
}

/** Test helper — closes the singleton between cases. */
export function closeSettingsDatabase(): void {
	dbInstance?.close();
	dbInstance = null;
}

import "@tanstack/react-start/server-only";

import { ensureTrackerDataDir, issuesDbPath } from "#/lib/storage/paths";
import { migrateSchema } from "#/lib/storage/schema";
import type { Database } from "#/lib/storage/sqlite";
import { openSqlite } from "#/lib/storage/sqlite";

let dbInstance: Database | null = null;

export function getIssuesDatabase(): Database {
	if (!dbInstance) {
		ensureTrackerDataDir();
		dbInstance = openSqlite(issuesDbPath());
		migrateSchema(dbInstance);
	}
	return dbInstance;
}

/** Test helper — closes the singleton between cases. */
export function closeIssuesDatabase(): void {
	dbInstance?.close();
	dbInstance = null;
}

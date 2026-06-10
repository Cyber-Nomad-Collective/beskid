import type { Database } from "bun:sqlite";

export const SCHEMA_VERSION = 1;

export function migrateSchema(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS schema_meta (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);

	const versionRow = db
		.query<{ value: string }, []>(
			"SELECT value FROM schema_meta WHERE key = 'version'",
		)
		.get();

	const current = versionRow ? Number.parseInt(versionRow.value, 10) : 0;

	if (current < 1) {
		db.run(`
			CREATE TABLE IF NOT EXISTS app_settings (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
		`);
		db.run(
			"INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '1')",
		);
	}
}

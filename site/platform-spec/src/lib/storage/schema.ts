import type { Database } from "#/lib/storage/sqlite";

export const SCHEMA_VERSION = 2;

/**
 * Idempotent, upsert-friendly schema migrations for the platform-spec settings
 * database. Every step is `CREATE ... IF NOT EXISTS`; the schema version is
 * upserted last so re-running the migration on an already-current database is a
 * no-op. Data seeding writes through `INSERT ... ON CONFLICT DO UPDATE`
 * (see spec-store), so migrate + seed can run on every container start safely.
 */
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
	}

	if (current < 2) {
		// Native-shape spec model, seeded (upserted) from the OpenSpec catalog.
		db.run(`
			CREATE TABLE IF NOT EXISTS spec_capability (
				capability TEXT PRIMARY KEY,
				id TEXT NOT NULL,
				slug TEXT NOT NULL,
				href TEXT NOT NULL,
				title TEXT NOT NULL,
				description TEXT,
				status TEXT,
				spec_level TEXT NOT NULL,
				domain TEXT,
				area TEXT,
				feature TEXT,
				requirement_count INTEGER NOT NULL DEFAULT 0,
				layout_id TEXT,
				layout_ok INTEGER NOT NULL DEFAULT 1,
				content_hash TEXT NOT NULL,
				payload TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
		`);
		db.run(
			"CREATE INDEX IF NOT EXISTS idx_spec_capability_domain_area ON spec_capability (domain, area);",
		);
		db.run(
			"CREATE INDEX IF NOT EXISTS idx_spec_capability_slug ON spec_capability (slug);",
		);
		db.run(`
			CREATE TABLE IF NOT EXISTS spec_layout (
				id TEXT PRIMARY KEY,
				spec_level TEXT NOT NULL,
				title TEXT NOT NULL,
				payload TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
		`);
		db.run(`
			CREATE TABLE IF NOT EXISTS spec_seed_meta (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
		`);
	}

	db.run(
		"INSERT INTO schema_meta (key, value) VALUES ('version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
		[String(SCHEMA_VERSION)],
	);
}

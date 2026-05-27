import type { Database } from "bun:sqlite";

export const AUTH_SCHEMA_VERSION = 2;

export function migrateAuthSchema(db: Database): void {
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
		applyV1(db);
		db.run(
			"INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '1')",
		);
	}

	if (current < 2) {
		applyV2(db);
		db.run(
			"INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '2')",
		);
	}
}

function applyV2(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS user_sessions (
			id TEXT PRIMARY KEY,
			github_token_encrypted TEXT NOT NULL,
			login TEXT NOT NULL,
			avatar_url TEXT NOT NULL,
			name TEXT,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
			ON user_sessions(expires_at);
	`);

	const cols = db
		.query<{ name: string }, []>("PRAGMA table_info(paired_apps)")
		.all();
	const hasService = cols.some((c) => c.name === "service_token_hash");
	if (!hasService) {
		db.run("ALTER TABLE paired_apps ADD COLUMN service_token_hash TEXT");
	}
}

function applyV1(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS hub_settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS paired_apps (
			id TEXT PRIMARY KEY,
			public_url TEXT NOT NULL,
			handoff_secret_hash TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			paired_at TEXT NOT NULL DEFAULT (datetime('now')),
			approved_by_login TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS pairing_requests (
			id TEXT PRIMARY KEY,
			app_id TEXT NOT NULL,
			public_url TEXT NOT NULL,
			code_hash TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			created_by_login TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS pairing_audit (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			request_id TEXT NOT NULL,
			event TEXT NOT NULL,
			actor_login TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (request_id) REFERENCES pairing_requests(id)
		);

		CREATE INDEX IF NOT EXISTS idx_pairing_requests_status
			ON pairing_requests(status);
	`);
}

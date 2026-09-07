import type { Database } from "#/lib/storage/sqlite";

export const SCHEMA_VERSION = 9;

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
		// V1 contains the retired whole-repository GitHub mirror. Existing
		// versioned databases still need its historical upgrade path, while a
		// fresh database can start directly from the retained schemas below.
		if (versionRow) applyV1(db);
		db.run(
			"INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '1')",
		);
	}

	if (current < 2) {
		applyV2(db);
		db.run("UPDATE schema_meta SET value = '2' WHERE key = 'version'");
	}

	if (current < 3) {
		applyV3(db);
		db.run("UPDATE schema_meta SET value = '3' WHERE key = 'version'");
	}

	if (current < 4) {
		applyV4(db);
		db.run("UPDATE schema_meta SET value = '4' WHERE key = 'version'");
	}

	if (current < 5) {
		applyV5(db);
		db.run("UPDATE schema_meta SET value = '5' WHERE key = 'version'");
	}

	if (current < 6) {
		applyV6(db);
		db.run("UPDATE schema_meta SET value = '6' WHERE key = 'version'");
	}

	if (current < 7) {
		applyV7(db);
		db.run("UPDATE schema_meta SET value = '7' WHERE key = 'version'");
	}

	if (current < 8) {
		applyV8(db);
		db.run("UPDATE schema_meta SET value = '8' WHERE key = 'version'");
	}

	if (current < 9) {
		applyV9(db);
		db.run("UPDATE schema_meta SET value = '9' WHERE key = 'version'");
	}
}

function addColumnIfMissing(
	db: Database,
	table: string,
	column: string,
	sql: string,
): void {
	const existing = db
		.query<{ name: string }, []>(
			`SELECT name FROM pragma_table_info('${table}') WHERE name = '${column}'`,
		)
		.get();
	if (!existing) db.run(`ALTER TABLE ${table} ADD COLUMN ${sql}`);
}

function applyV8(db: Database): void {
	addColumnIfMissing(
		db,
		"tracker_versions",
		"visibility",
		"visibility TEXT NOT NULL DEFAULT 'internal'",
	);
	addColumnIfMissing(
		db,
		"tracker_versions",
		"catalog_revision",
		"catalog_revision TEXT",
	);
	addColumnIfMissing(
		db,
		"tracker_task_spec_relations",
		"catalog_revision",
		"catalog_revision TEXT",
	);
	addColumnIfMissing(
		db,
		"tracker_tasks",
		"provenance_start_sha",
		"provenance_start_sha TEXT",
	);
	addColumnIfMissing(
		db,
		"tracker_tasks",
		"provenance_end_sha",
		"provenance_end_sha TEXT",
	);
}

function applyV9(db: Database): void {
	addColumnIfMissing(
		db,
		"tracker_tasks",
		"repo_paths_json",
		"repo_paths_json TEXT NOT NULL DEFAULT '[]'",
	);
}

function applyV7(db: Database): void {
	const column = db
		.query<{ name: string }, []>(
			"SELECT name FROM pragma_table_info('tracker_task_spec_relations') WHERE name = 'standard_id'",
		)
		.get();
	if (!column) {
		db.run("ALTER TABLE tracker_task_spec_relations ADD COLUMN standard_id TEXT");
	}
}

function applyV6(db: Database): void {
	const tx = db.transaction(() => {
		db.run("DELETE FROM github_sync_outbox WHERE entity_type <> 'bug'");
		db.run("DELETE FROM github_issue_links WHERE entity_type <> 'bug'");
		db.run(
			"DELETE FROM sync_settings WHERE key IN ('sync.export_active_version_tasks', 'sync.active_version_override')",
		);
		db.run("DROP TABLE IF EXISTS repo_labels");
		db.run("DROP TABLE IF EXISTS sync_state");
		db.run("DROP TABLE IF EXISTS github_issues");
	});
	tx();
}

function applyV5(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS tracker_versions (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			summary TEXT NOT NULL,
			theme TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'Planned',
			cutoff_json TEXT NOT NULL,
			sort_key INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS tracker_workstreams (
			version_id TEXT NOT NULL,
			slug TEXT NOT NULL,
			title TEXT NOT NULL,
			summary TEXT NOT NULL,
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			PRIMARY KEY (version_id, slug),
			FOREIGN KEY (version_id) REFERENCES tracker_versions(id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS tracker_deliverables (
			version_id TEXT NOT NULL,
			id TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT,
			closed_on TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			PRIMARY KEY (version_id, id),
			FOREIGN KEY (version_id) REFERENCES tracker_versions(id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS tracker_tasks (
			version_id TEXT NOT NULL,
			id TEXT NOT NULL,
			title TEXT NOT NULL,
			status_column TEXT NOT NULL,
			priority TEXT NOT NULL DEFAULT 'medium',
			workstream TEXT,
			domain TEXT,
			area TEXT,
			feature TEXT,
			owner TEXT,
			sort_order INTEGER,
			deliverable_id TEXT,
			body TEXT NOT NULL DEFAULT '',
			spec_approval TEXT,
			completed_at TEXT,
			source_json TEXT NOT NULL,
			local_updated_at TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			PRIMARY KEY (version_id, id),
			FOREIGN KEY (version_id) REFERENCES tracker_versions(id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_tracker_tasks_version_status
		ON tracker_tasks (version_id, status_column);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS tracker_task_subtasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			version_id TEXT NOT NULL,
			task_id TEXT NOT NULL,
			text TEXT NOT NULL,
			done INTEGER NOT NULL DEFAULT 0,
			sort_order INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (version_id, task_id) REFERENCES tracker_tasks(version_id, id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_tracker_task_subtasks_task
		ON tracker_task_subtasks (version_id, task_id, sort_order);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS tracker_task_spec_relations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			version_id TEXT NOT NULL,
			task_id TEXT NOT NULL,
			path TEXT NOT NULL,
			href TEXT,
			title TEXT,
			level TEXT,
			relation TEXT NOT NULL,
			required INTEGER NOT NULL DEFAULT 0,
			sort_order INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (version_id, task_id) REFERENCES tracker_tasks(version_id, id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_tracker_task_spec_relations_task
		ON tracker_task_spec_relations (version_id, task_id, sort_order);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS tracker_bugs (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			body TEXT NOT NULL DEFAULT '',
			state TEXT NOT NULL DEFAULT 'open',
			author TEXT,
			component_id TEXT,
			subcomponent_id TEXT,
			fields_json TEXT NOT NULL DEFAULT '{}',
			local_updated_at TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_tracker_bugs_state
		ON tracker_bugs (state);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS github_issue_links (
			entity_type TEXT NOT NULL,
			entity_id TEXT NOT NULL,
			github_number INTEGER NOT NULL,
			github_url TEXT NOT NULL,
			github_updated_at TEXT,
			last_synced_at TEXT,
			sync_state TEXT NOT NULL DEFAULT 'pending',
			PRIMARY KEY (entity_type, entity_id)
		);
	`);

	db.run(`
		CREATE UNIQUE INDEX IF NOT EXISTS idx_github_issue_links_number
		ON github_issue_links (github_number);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS github_sync_outbox (
			id TEXT PRIMARY KEY,
			entity_type TEXT NOT NULL,
			entity_id TEXT NOT NULL,
			operation TEXT NOT NULL,
			payload_json TEXT NOT NULL DEFAULT '{}',
			attempts INTEGER NOT NULL DEFAULT 0,
			last_error TEXT,
			created_at TEXT NOT NULL
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_github_sync_outbox_created
		ON github_sync_outbox (created_at ASC);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS sync_settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);
}

function applyV4(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS app_settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);
}

function applyV1(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS github_issues (
			number INTEGER PRIMARY KEY,
			state TEXT NOT NULL,
			is_pull_request INTEGER NOT NULL DEFAULT 0,
			has_bug_label INTEGER NOT NULL DEFAULT 0,
			payload TEXT NOT NULL,
			github_updated_at TEXT,
			synced_at TEXT NOT NULL
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_github_issues_state
		ON github_issues (state);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_github_issues_bug_open
		ON github_issues (has_bug_label, state)
		WHERE has_bug_label = 1;
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS repo_labels (
			name TEXT PRIMARY KEY,
			synced_at TEXT NOT NULL
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS sync_state (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			last_success_at TEXT,
			last_attempt_at TEXT,
			last_error TEXT,
			open_issue_count INTEGER NOT NULL DEFAULT 0,
			bug_issue_count INTEGER NOT NULL DEFAULT 0
		);
	`);

	db.run(`
		INSERT OR IGNORE INTO sync_state (id) VALUES (1);
	`);
}

function applyV2(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS sync_runs (
			id TEXT PRIMARY KEY,
			kind TEXT NOT NULL,
			status TEXT NOT NULL,
			phase TEXT,
			progress_current INTEGER NOT NULL DEFAULT 0,
			progress_total INTEGER NOT NULL DEFAULT 0,
			started_at TEXT NOT NULL,
			finished_at TEXT,
			error TEXT,
			summary TEXT
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS sync_log_lines (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			run_id TEXT NOT NULL,
			level TEXT NOT NULL DEFAULT 'info',
			message TEXT NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (run_id) REFERENCES sync_runs(id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_sync_log_lines_run
		ON sync_log_lines (run_id, id);
	`);
}

function applyV3(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS spec_proposals (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			summary TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'draft',
			author_login TEXT NOT NULL,
			base_ref TEXT NOT NULL DEFAULT 'main',
			head_branch TEXT,
			pr_number INTEGER,
			pr_url TEXT,
			validation_json TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_spec_proposals_status
		ON spec_proposals (status, updated_at DESC);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS spec_proposal_changes (
			id TEXT PRIMARY KEY,
			proposal_id TEXT NOT NULL,
			change_kind TEXT NOT NULL,
			repo_path TEXT NOT NULL,
			slug TEXT NOT NULL,
			path_class TEXT NOT NULL,
			spec_level TEXT NOT NULL,
			frontmatter_json TEXT NOT NULL DEFAULT '{}',
			body_md TEXT NOT NULL DEFAULT '',
			layout_json TEXT,
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (proposal_id) REFERENCES spec_proposals(id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_spec_proposal_changes_proposal
		ON spec_proposal_changes (proposal_id, sort_order);
	`);
}

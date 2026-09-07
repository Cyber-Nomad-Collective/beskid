import { describe, expect, it } from "vitest";
import { migrateSchema, SCHEMA_VERSION } from "#/lib/storage/schema";
import { openSqlite } from "#/lib/storage/sqlite";
import type { GitHubIssuePayload } from "#/lib/storage/stored-issue";
import {
	classifyGithubIssueForSync,
	isGithubSyncOutboxEntrySupported,
} from "#/lib/tracker/bug-only-sync-policy";
import {
	getTrackerTask,
	upsertTrackerTask,
} from "#/lib/tracker/repositories/tasks-repository";
import { approveTaskSpec } from "#/lib/tracker/task-service";

function issue(labels: string[]): GitHubIssuePayload {
	return {
		number: 42,
		title: "Example",
		body: "",
		state: "open",
		html_url: "https://github.test/issues/42",
		created_at: new Date().toISOString(),
		labels: labels.map((name) => ({ name })),
		user: null,
		assignees: [],
		milestone: null,
	} as unknown as GitHubIssuePayload;
}

describe("bug-only GitHub sync", () => {
	it("exports bug outbox entries and rejects task entries", () => {
		expect(isGithubSyncOutboxEntrySupported({ entityType: "bug" })).toBe(true);
		expect(isGithubSyncOutboxEntrySupported({ entityType: "task" })).toBe(false);
	});

	it("accepts bug webhook issues and rejects roadmap tasks", () => {
		expect(classifyGithubIssueForSync(issue(["bug"]))).toBe("bug");
		expect(classifyGithubIssueForSync(issue(["roadmap", "version:v0.4"]))).toBe(
			"unsupported",
		);
	});

	it("migrates existing databases to bug-only GitHub persistence", () => {
		const db = openSqlite(":memory:");
		migrateSchema(db);

		db.run(
			"INSERT INTO github_issue_links (entity_type, entity_id, github_number, github_url) VALUES ('task', 'v0.4:task', 10, 'https://github.test/10'), ('bug', 'bug-1', 11, 'https://github.test/11')",
		);
		db.run(
			"INSERT INTO github_sync_outbox (id, entity_type, entity_id, operation, created_at) VALUES ('task-entry', 'task', 'v0.4:task', 'update', '2026-01-01'), ('bug-entry', 'bug', 'bug-1', 'update', '2026-01-01')",
		);
		db.run(
			"INSERT INTO sync_settings (key, value, updated_at) VALUES ('sync.export_active_version_tasks', 'true', '2026-01-01')",
		);

		// Re-run the current migration after simulating a v5 database.
		db.run("UPDATE schema_meta SET value = '5' WHERE key = 'version'");
		migrateSchema(db);

		expect(SCHEMA_VERSION).toBe(9);
		expect(
			db
				.query<{ name: string }, []>(
					"SELECT name FROM pragma_table_info('tracker_task_spec_relations') WHERE name = 'standard_id'",
				)
				.get()?.name,
		).toBe("standard_id");
		expect(
			db
				.query<{ name: string }, []>(
					"SELECT name FROM pragma_table_info('tracker_tasks') WHERE name = 'repo_paths_json'",
				)
				.get()?.name,
		).toBe("repo_paths_json");
		expect(
			db
				.query<{ count: number }, []>(
					"SELECT COUNT(*) AS count FROM github_issue_links WHERE entity_type = 'task'",
				)
				.get()?.count,
		).toBe(0);
		expect(
			db
				.query<{ count: number }, []>(
					"SELECT COUNT(*) AS count FROM github_issue_links WHERE entity_type = 'bug'",
				)
				.get()?.count,
		).toBe(1);
		expect(
			db
				.query<{ count: number }, []>(
					"SELECT COUNT(*) AS count FROM github_sync_outbox WHERE entity_type = 'task'",
				)
				.get()?.count,
		).toBe(0);
		expect(
			db
				.query<{ count: number }, []>(
					"SELECT COUNT(*) AS count FROM github_sync_outbox WHERE entity_type = 'bug'",
				)
				.get()?.count,
		).toBe(1);
		expect(
			db
				.query<{ count: number }, []>(
					"SELECT COUNT(*) AS count FROM sync_settings WHERE key = 'sync.export_active_version_tasks'",
				)
				.get()?.count,
		).toBe(0);

		db.close();
	});
});

describe("tracker-native task writes", () => {
	it("approves a task by version and task id", async () => {
		const db = openSqlite(":memory:");
		migrateSchema(db);
		upsertTrackerTask(db, "v0.4", {
			id: "native-task",
			title: "Native task",
			statusColumn: "Backlog",
			priority: "medium",
			specRelations: [
				{
					standardId: "BSP-REQ-EXAMPLE",
					path: "/standard/example",
					relation: "tracks",
					required: false,
				},
			],
			specApproval: "pending",
			body: "",
			subtasks: [],
			source: { repo: "beskid", commit: "abc", subject: "Native task" },
		});

		const approved = await approveTaskSpec("v0.4", "native-task", db);

		expect(approved.specApproval).toBe("approved");
		expect(
			getTrackerTask("v0.4", "native-task", db)?.specRelations[0]?.standardId,
		).toBe("BSP-REQ-EXAMPLE");
		expect(
			db
				.query<{ count: number }, []>(
					"SELECT COUNT(*) AS count FROM github_sync_outbox",
				)
				.get()?.count,
		).toBe(0);
		db.close();
	});
});

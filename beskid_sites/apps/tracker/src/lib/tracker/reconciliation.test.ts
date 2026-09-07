import { describe, expect, it } from "vitest";
import type { ParsedSeedBundle } from "#/lib/seed/parse-uploaded-bundle";
import { migrateSchema } from "#/lib/storage/schema";
import type { Database } from "#/lib/storage/sqlite";
import { openSqlite } from "#/lib/storage/sqlite";
import {
	applyTrackerReconciliation,
	planTrackerReconciliation,
} from "#/lib/tracker/reconciliation";
import {
	upsertTrackerTask,
	upsertTrackerWorkstream,
} from "#/lib/tracker/repositories/tasks-repository";
import { upsertTrackerVersion } from "#/lib/tracker/repositories/versions-repository";

const source = {
	repo: "beskid" as const,
	commit: "abcdef1",
	subject: "seed task",
};

const fixtureSeed: ParsedSeedBundle = {
	versionId: "v0.5",
	version: {
		id: "v0.5",
		title: "Version 0.5",
		summary: "Reconciliation fixture",
		theme: "delivery",
		status: "In Progress",
		cutoff: {
			startDate: "2026-01-01",
			endDate: "2026-12-31",
			endCommitSha: "abcdef1",
			endCommitRepo: "beskid",
			rationale: "test",
		},
	},
	workstreams: [{ slug: "core", title: "Core", summary: "Core work", order: 0 }],
	deliverables: [],
	tasks: [
		{
			id: "new-task",
			title: "New task",
			statusColumn: "Backlog",
			priority: "medium",
			workstream: "core",
			specRelations: [],
			subtasks: [],
			source,
		},
		{
			id: "edited-task",
			title: "Edited task",
			statusColumn: "Backlog",
			priority: "medium",
			workstream: "core",
			specRelations: [],
			subtasks: [],
			source,
		},
	],
};

function fixtureDb(): Database {
	const db = openSqlite(":memory:");
	migrateSchema(db);
	upsertTrackerVersion(db, fixtureSeed.version);
	upsertTrackerWorkstream(db, fixtureSeed.versionId, fixtureSeed.workstreams[0]);
	upsertTrackerTask(db, fixtureSeed.versionId, {
		...fixtureSeed.tasks[1],
		title: "Locally edited task",
		source: { ...source, commit: "abcdef2" },
	});
	upsertTrackerTask(db, fixtureSeed.versionId, {
		id: "old-task",
		title: "Old task",
		statusColumn: "Backlog",
		priority: "medium",
		workstream: "core",
		specRelations: [
			{
				standardId: "req:parser",
				catalogRevision: "catalog-4",
				path: "/spec/parser",
				relation: "implements",
				required: true,
			},
		],
		subtasks: [],
		source,
	});
	return db;
}

const fixtureCatalog = {
	revision: "catalog-5",
	links: [
		{
			standardId: "req:parser",
			catalogRevision: "catalog-5",
		},
	],
};

describe("tracker reconciliation", () => {
	it("plans create, stale, and conflict operations without mutation", () => {
		const database = fixtureDb();
		const plan = planTrackerReconciliation({
			database,
			seed: fixtureSeed,
			catalog: fixtureCatalog,
		});

		expect(plan.create).toHaveLength(1);
		expect(plan.stale).toEqual([
			{ taskId: "old-task", reason: "catalog-revision" },
		]);
		expect(plan.conflicts).toEqual([
			{ taskId: "edited-task", reason: "local-and-seed-diverged" },
		]);
		expect(
			database.query("SELECT count(*) AS count FROM tracker_tasks").get(),
		).toMatchObject({ count: 2 });
	});

	it("requires an approved proposal digest before applying mutations", () => {
		const database = fixtureDb();
		const plan = planTrackerReconciliation({
			database,
			seed: fixtureSeed,
			catalog: fixtureCatalog,
		});

		expect(() => applyTrackerReconciliation(database, plan)).toThrow(
			"approved proposal digest",
		);
		expect(
			applyTrackerReconciliation(database, {
				...plan,
				approvedProposalDigest: plan.proposalDigest,
			}),
		).toMatchObject({ created: 1, stale: 1, conflicts: 1 });
	});
});

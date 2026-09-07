import { describe, expect, it } from "vitest";
import type { ParsedSeedBundle } from "#/lib/seed/parse-uploaded-bundle";
import { closeIssuesDatabase, getIssuesDatabase } from "#/lib/storage/db";
import { upsertParsedSeedBundle } from "#/lib/tracker/import-catalog";
import { trackerTaskToRoadmapTask } from "#/lib/tracker/mappers";
import {
	listTrackerTasks,
	listTrackerTasksForBoard,
	upsertTrackerTask,
	upsertTrackerWorkstream,
} from "#/lib/tracker/repositories/tasks-repository";
import {
	listTrackerVersions,
	upsertTrackerVersion,
} from "#/lib/tracker/repositories/versions-repository";

const sampleBundle: ParsedSeedBundle = {
	versionId: "v9.9",
	version: {
		id: "v9.9",
		title: "Test version",
		summary: "Import test",
		theme: "testing",
		status: "In Progress",
		cutoff: {
			startDate: "2026-01-01",
			endDate: "2026-12-31",
			endCommitSha: "abc1234",
			endCommitRepo: "beskid",
			rationale: "test",
		},
	},
	workstreams: [
		{
			slug: "core",
			title: "Core",
			summary: "Core workstream",
			order: 0,
		},
	],
	deliverables: [
		{
			id: "alpha",
			title: "Alpha deliverable",
			subtasks: [],
		},
	],
	tasks: [
		{
			id: "task-one",
			title: "First task",
			statusColumn: "Backlog",
			priority: "high",
			workstream: "core",
			deliverableId: "alpha",
			specRelations: [],
			subtasks: [{ text: "Step", done: false }],
			source: {
				repo: "beskid",
				commit: "abc1234",
				subject: "seed task",
			},
		},
	],
};

describe("catalog import", () => {
	it("upserts seed bundle into normalized tables", () => {
		const db = getIssuesDatabase();
		upsertTrackerVersion(db, sampleBundle.version);
		const summary = upsertParsedSeedBundle(sampleBundle, db);
		expect(summary.tasksUpserted).toBe(1);
		expect(summary.conflicts).toBe(0);
		expect(summary.stale).toBe(0);
		expect(listTrackerVersions(db).some((v) => v.id === "v9.9")).toBe(true);

		const tasks = listTrackerTasksForBoard("v9.9", db);
		expect(tasks).toHaveLength(1);
		const roadmapTask = trackerTaskToRoadmapTask(tasks[0]);
		expect(roadmapTask.title).toBe("First task");
		expect(roadmapTask.version).toBe("v9.9");

		db.run("DELETE FROM tracker_task_subtasks WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_tasks WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_deliverables WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_workstreams WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_versions WHERE id = 'v9.9'");
		closeIssuesDatabase();
	});

	it("does not overwrite locally diverged tasks during reconciliation import", () => {
		const db = getIssuesDatabase();
		upsertTrackerVersion(db, sampleBundle.version);
		upsertTrackerWorkstream(
			db,
			sampleBundle.versionId,
			sampleBundle.workstreams[0],
		);
		upsertTrackerTask(db, sampleBundle.versionId, {
			...sampleBundle.tasks[0],
			title: "Locally edited",
			source: { ...sampleBundle.tasks[0].source, commit: "local999" },
		});

		const summary = upsertParsedSeedBundle(sampleBundle, db);
		expect(summary.tasksUpserted).toBe(0);
		expect(summary.conflicts).toBe(1);
		expect(listTrackerTasks(sampleBundle.versionId, db)[0]?.title).toBe(
			"Locally edited",
		);

		db.run("DELETE FROM tracker_task_subtasks WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_tasks WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_deliverables WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_workstreams WHERE version_id = 'v9.9'");
		db.run("DELETE FROM tracker_versions WHERE id = 'v9.9'");
		closeIssuesDatabase();
	});
});

import { describe, expect, it } from "vitest";
import type { RoadmapTask } from "#/lib/github/types";
import {
	selectTaskProperties,
	type TaskDisplayConfig,
} from "#/lib/roadmap/task-display";
import { migrateSchema } from "#/lib/storage/schema";
import { openSqlite } from "#/lib/storage/sqlite";
import {
	listTrackerTasks,
	upsertTrackerTask,
} from "#/lib/tracker/repositories/tasks-repository";
import { moveRoadmapTaskToColumn } from "#/lib/tracker/task-service";

const task: RoadmapTask = {
	id: "parser",
	number: 12,
	title: "Finish parser",
	owner: "compiler-team",
	priority: "high",
	statusColumn: "In Progress",
	body: "Implement the parser.",
	specRelations: [],
	subtasks: [],
	specApproval: "pending",
	version: "v0.5",
	workstream: "compiler",
	htmlUrl: "https://tracker.test/parser",
	labelNames: [],
};

describe("task display configuration", () => {
	it("uses configured property ordering for card and preview", () => {
		const config: TaskDisplayConfig = {
			properties: ["priority", "workstream"],
		};

		expect(selectTaskProperties(task, config)).toEqual([
			["priority", "High"],
			["workstream", "compiler"],
		]);
	});

	it("omits unset configured properties", () => {
		expect(
			selectTaskProperties(
				{ ...task, workstream: undefined },
				{
					properties: ["workstream", "owner"],
				},
			),
		).toEqual([["owner", "compiler-team"]]);
	});

	it("persists a same-column reorder", async () => {
		const db = openSqlite(":memory:");
		migrateSchema(db);
		for (const [id, order] of [
			["one", 0],
			["two", 1],
		] as const) {
			upsertTrackerTask(db, "v0.5", {
				id,
				title: id,
				statusColumn: "In Progress",
				priority: "medium",
				order,
				specRelations: [],
				subtasks: [],
				source: { repo: "beskid", commit: "abc", subject: id },
			});
		}

		await moveRoadmapTaskToColumn(
			{ versionId: "v0.5", taskId: "two" },
			"In Progress",
			0,
			db,
		);

		expect(listTrackerTasks("v0.5", db).map((item) => item.id)).toEqual([
			"two",
			"one",
		]);
	});
});

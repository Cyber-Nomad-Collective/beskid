import "@tanstack/react-start/server-only";

import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import { ROADMAP_COLUMNS } from "#/lib/github/roadmap-labels";
import type { RoadmapTask } from "#/lib/github/types";
import type { SpecRelation } from "#/lib/platform-spec/relations";
import type { SubtaskRow } from "#/lib/report-issue/field-values";
import type { SeedSubtask, SeedTask } from "#/lib/seed/schemas";
import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import { trackerTaskToRoadmapTask } from "#/lib/tracker/mappers";
import {
	getTrackerTask,
	listTrackerDeliverables,
	listTrackerTasks,
	upsertTrackerTask,
} from "#/lib/tracker/repositories/tasks-repository";
import type { TrackerTask } from "#/lib/tracker/types";

export interface CreateRoadmapTaskInput {
	title: string;
	body: string;
	priority: "high" | "medium" | "low";
	statusColumn: RoadmapColumnId;
	version: string;
	workstream?: string;
	specRelations: SpecRelation[];
	repoPaths?: string[];
	taskId?: string;
	owner?: string;
}

export interface UpdateRoadmapTaskInput {
	versionId: string;
	taskId: string;
	title?: string;
	body?: string;
	priority?: "high" | "medium" | "low";
	specRelations?: SpecRelation[];
	repoPaths?: string[];
	subtasks?: SubtaskRow[];
	workstream?: string;
	statusColumn?: RoadmapColumnId;
	specApproval?: "pending" | "approved";
}

export interface TaskRef {
	versionId: string;
	taskId: string;
}

function slugifyTaskId(title: string): string {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return slug || "task";
}

function uniqueTaskId(db: Database, versionId: string, title: string): string {
	const base = slugifyTaskId(title);
	let candidate = base;
	let suffix = 2;
	while (getTrackerTask(versionId, candidate, db)) {
		candidate = `${base}-${suffix}`;
		suffix += 1;
	}
	return candidate;
}

function specRelationsToSeed(
	relations: SpecRelation[],
): SeedTask["specRelations"] {
	return relations.map((relation) => ({
		standardId: relation.standardId,
		path: relation.path,
		href: relation.href,
		title: relation.title,
		level: relation.level,
		relation: relation.relation,
		required: relation.required,
	}));
}

function subtasksToSeed(subtasks: SubtaskRow[]): SeedSubtask[] {
	return subtasks.map((step) => ({
		text: step.text,
		done: step.done,
	}));
}

function trackerTaskToSeedTask(task: TrackerTask, taskId: string): SeedTask {
	return {
		id: taskId,
		title: task.title,
		statusColumn: task.statusColumn,
		priority: task.priority,
		workstream: task.workstream,
		domain: task.domain,
		area: task.area,
		feature: task.feature,
		owner: task.owner,
		order: task.sortOrder,
		deliverableId: task.deliverableId,
		specRelations: task.specRelations.map((relation) => ({
			standardId: relation.standardId,
			path: relation.path,
			href: relation.href,
			title: relation.title,
			level: relation.level,
			relation: relation.relation,
			required: relation.required,
		})),
		specApproval: task.specApproval,
		body: task.body,
		repoPaths: task.repoPaths ?? [],
		subtasks: task.subtasks.map((step) => ({
			text: step.text,
			done: step.done,
		})),
		source: task.source,
		completedAt: task.completedAt,
	};
}

function taskToRoadmapTask(
	versionId: string,
	taskId: string,
	db: Database,
): RoadmapTask {
	const task = getTrackerTask(versionId, taskId, db);
	if (!task) {
		throw new Error(`Task ${versionId}:${taskId} not found`);
	}
	const deliverableTitle = task.deliverableId
		? listTrackerDeliverables(versionId, db).find(
				(deliverable) => deliverable.id === task.deliverableId,
			)?.title
		: undefined;
	return trackerTaskToRoadmapTask({
		...task,
		deliverableTitle,
		displayNumber: task.sortOrder,
	});
}

export async function createRoadmapTask(
	input: CreateRoadmapTaskInput,
	db?: Database,
): Promise<RoadmapTask> {
	const database = db ?? getIssuesDatabase();
	const taskId =
		input.taskId ?? uniqueTaskId(database, input.version, input.title);
	const seedTask: SeedTask = {
		id: taskId,
		title: input.title.trim(),
		statusColumn: input.statusColumn,
		priority: input.priority,
		workstream: input.workstream,
		owner: input.owner,
		specRelations: specRelationsToSeed(input.specRelations),
		specApproval: input.specRelations.length > 0 ? "pending" : undefined,
		body: input.body.trim(),
		repoPaths: input.repoPaths ?? [],
		subtasks: [],
		source: {
			repo: "beskid",
			commit: "0000000",
			subject: input.title.trim(),
		},
	};

	upsertTrackerTask(database, input.version, seedTask);

	return taskToRoadmapTask(input.version, taskId, database);
}

export async function updateRoadmapTask(
	input: UpdateRoadmapTaskInput,
	db?: Database,
): Promise<RoadmapTask> {
	const database = db ?? getIssuesDatabase();
	const { versionId, taskId } = input;
	const existing = getTrackerTask(versionId, taskId, database);
	if (!existing) {
		throw new Error(`Task ${versionId}:${taskId} not found`);
	}

	const seedTask = trackerTaskToSeedTask(existing, taskId);
	if (input.title !== undefined) seedTask.title = input.title.trim();
	if (input.body !== undefined) {
		seedTask.body = input.body.trim();
	}
	if (input.priority !== undefined) seedTask.priority = input.priority;
	if (input.workstream !== undefined) seedTask.workstream = input.workstream;
	if (input.statusColumn !== undefined)
		seedTask.statusColumn = input.statusColumn;
	if (input.specApproval !== undefined)
		seedTask.specApproval = input.specApproval;
	if (input.specRelations !== undefined) {
		seedTask.specRelations = specRelationsToSeed(input.specRelations);
	}
	if (input.repoPaths !== undefined) {
		seedTask.repoPaths = input.repoPaths;
	}
	if (input.subtasks !== undefined) {
		seedTask.subtasks = subtasksToSeed(input.subtasks);
	}

	upsertTrackerTask(database, versionId, seedTask);

	return taskToRoadmapTask(versionId, taskId, database);
}

export async function moveRoadmapTaskToColumn(
	ref: TaskRef,
	targetColumn: RoadmapColumnId,
	targetIndex: number,
	db?: Database,
): Promise<RoadmapTask> {
	const database = db ?? getIssuesDatabase();
	const task = getTrackerTask(ref.versionId, ref.taskId, database);
	if (!task) {
		throw new Error(`Task ${ref.versionId}:${ref.taskId} not found`);
	}

	const tasks = listTrackerTasks(ref.versionId, database);
	const columns = new Map<RoadmapColumnId, typeof tasks>();
	for (const column of ROADMAP_COLUMNS) columns.set(column.id, []);
	for (const item of tasks) columns.get(item.statusColumn)?.push(item);
	for (const items of columns.values()) {
		const index = items.findIndex((item) => item.id === ref.taskId);
		if (index >= 0) items.splice(index, 1);
	}
	const destination = columns.get(targetColumn);
	if (!destination) throw new Error(`Unknown roadmap column ${targetColumn}`);
	destination.splice(Math.max(0, Math.min(targetIndex, destination.length)), 0, {
		...task,
		statusColumn: targetColumn,
	});

	const ordered = ROADMAP_COLUMNS.flatMap(
		(column) => columns.get(column.id) ?? [],
	);
	database.run("BEGIN");
	try {
		for (const [index, item] of ordered.entries()) {
			database.run(
				"UPDATE tracker_tasks SET status_column = ?, sort_order = ?, updated_at = ? WHERE version_id = ? AND id = ?",
				[
					item.statusColumn,
					index,
					new Date().toISOString(),
					ref.versionId,
					item.id,
				],
			);
		}
		database.run("COMMIT");
	} catch (error) {
		database.run("ROLLBACK");
		throw error;
	}

	return taskToRoadmapTask(ref.versionId, ref.taskId, database);
}

export async function approveTaskSpec(
	versionId: string,
	taskId: string,
	db?: Database,
): Promise<RoadmapTask> {
	return updateRoadmapTask({ versionId, taskId, specApproval: "approved" }, db);
}

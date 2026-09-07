import "@tanstack/react-start/server-only";

import type {
	SeedDeliverable,
	SeedTask,
	SeedWorkstream,
} from "#/lib/seed/schemas";
import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import {
	rowToTrackerDeliverable,
	rowToTrackerTask,
} from "#/lib/tracker/mappers";
import type {
	TrackerDeliverable,
	TrackerDeliverableRow,
	TrackerTask,
	TrackerTaskRow,
	TrackerTaskSpecRelationRow,
	TrackerTaskSubtaskRow,
	TrackerTaskWithContext,
} from "#/lib/tracker/types";

function nowIso(): string {
	return new Date().toISOString();
}

export function upsertTrackerWorkstream(
	db: Database,
	versionId: string,
	workstream: SeedWorkstream,
): void {
	const now = nowIso();
	db.run(
		`
		INSERT INTO tracker_workstreams (
			version_id, slug, title, summary, sort_order, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(version_id, slug) DO UPDATE SET
			title = excluded.title,
			summary = excluded.summary,
			sort_order = excluded.sort_order,
			updated_at = excluded.updated_at
		`,
		[
			versionId,
			workstream.slug,
			workstream.title,
			workstream.summary,
			workstream.order ?? 0,
			now,
			now,
		],
	);
}

export function upsertTrackerDeliverable(
	db: Database,
	versionId: string,
	deliverable: SeedDeliverable,
): void {
	const now = nowIso();
	db.run(
		`
		INSERT INTO tracker_deliverables (
			version_id, id, title, description, closed_on, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(version_id, id) DO UPDATE SET
			title = excluded.title,
			description = excluded.description,
			closed_on = excluded.closed_on,
			updated_at = excluded.updated_at
		`,
		[
			versionId,
			deliverable.id,
			deliverable.title,
			deliverable.description ?? null,
			deliverable.closedOn ?? null,
			now,
			now,
		],
	);
}

function replaceTaskSubtasks(
	db: Database,
	versionId: string,
	taskId: string,
	subtasks: SeedTask["subtasks"],
): void {
	db.run(
		"DELETE FROM tracker_task_subtasks WHERE version_id = ? AND task_id = ?",
		[versionId, taskId],
	);
	for (const [index, subtask] of subtasks.entries()) {
		db.run(
			`
			INSERT INTO tracker_task_subtasks (version_id, task_id, text, done, sort_order)
			VALUES (?, ?, ?, ?, ?)
			`,
			[versionId, taskId, subtask.text, subtask.done ? 1 : 0, index],
		);
	}
}

function replaceTaskSpecRelations(
	db: Database,
	versionId: string,
	taskId: string,
	relations: SeedTask["specRelations"],
): void {
	db.run(
		"DELETE FROM tracker_task_spec_relations WHERE version_id = ? AND task_id = ?",
		[versionId, taskId],
	);
	for (const [index, relation] of relations.entries()) {
		db.run(
			`
			INSERT INTO tracker_task_spec_relations (
				version_id, task_id, standard_id, catalog_revision, path, href, title, level, relation, required, sort_order
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`,
			[
				versionId,
				taskId,
				relation.standardId ?? null,
				relation.catalogRevision ?? null,
				relation.path,
				relation.href ?? null,
				relation.title ?? null,
				relation.level ?? null,
				relation.relation,
				relation.required ? 1 : 0,
				index,
			],
		);
	}
}

export function upsertTrackerTask(
	db: Database,
	versionId: string,
	task: SeedTask,
): void {
	if (task.workstream) {
		const workstream = db
			.query<{ slug: string }, [string, string]>(
				"SELECT slug FROM tracker_workstreams WHERE version_id = ? AND slug = ?",
			)
			.get(versionId, task.workstream);
		if (!workstream) {
			throw new Error(
				`Unknown workstream ${task.workstream} for version ${versionId}`,
			);
		}
	}
	const now = nowIso();
	const deliverableId = task.deliverableId ?? task.milestoneId ?? null;
	db.run(
		`
		INSERT INTO tracker_tasks (
			version_id, id, title, status_column, priority, workstream, domain, area, feature,
			owner, sort_order, deliverable_id, body, spec_approval, completed_at, source_json,
			repo_paths_json, local_updated_at, provenance_start_sha, provenance_end_sha, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(version_id, id) DO UPDATE SET
			title = excluded.title,
			status_column = excluded.status_column,
			priority = excluded.priority,
			workstream = excluded.workstream,
			domain = excluded.domain,
			area = excluded.area,
			feature = excluded.feature,
			owner = excluded.owner,
			sort_order = excluded.sort_order,
			deliverable_id = excluded.deliverable_id,
			body = excluded.body,
			spec_approval = excluded.spec_approval,
			completed_at = excluded.completed_at,
			source_json = excluded.source_json,
			repo_paths_json = excluded.repo_paths_json,
			local_updated_at = excluded.local_updated_at,
			provenance_start_sha = excluded.provenance_start_sha,
			provenance_end_sha = excluded.provenance_end_sha,
			updated_at = excluded.updated_at
		`,
		[
			versionId,
			task.id,
			task.title,
			task.statusColumn,
			task.priority,
			task.workstream ?? null,
			task.domain ?? null,
			task.area ?? null,
			task.feature ?? null,
			task.owner ?? null,
			task.order ?? null,
			deliverableId,
			task.body ?? "",
			task.specApproval ?? null,
			task.completedAt ?? null,
			JSON.stringify(task.source),
			JSON.stringify(task.repoPaths ?? []),
			now,
			task.source.commit,
			task.source.commit,
			now,
			now,
		],
	);
	replaceTaskSubtasks(db, versionId, task.id, task.subtasks);
	replaceTaskSpecRelations(db, versionId, task.id, task.specRelations);
}

export function listTrackerTaskRows(
	db: Database,
	versionId?: string,
): TrackerTaskRow[] {
	if (versionId) {
		return db
			.query<TrackerTaskRow, [string]>(
				`
				SELECT
					version_id, id, title, status_column, priority, workstream, domain, area, feature,
					owner, sort_order, deliverable_id, body, spec_approval, completed_at, source_json,
					repo_paths_json, local_updated_at, created_at, updated_at
				FROM tracker_tasks
				WHERE version_id = ?
				ORDER BY sort_order ASC, id ASC
				`,
			)
			.all(versionId);
	}
	return db
		.query<TrackerTaskRow, []>(
			`
			SELECT
				version_id, id, title, status_column, priority, workstream, domain, area, feature,
				owner, sort_order, deliverable_id, body, spec_approval, completed_at, source_json,
				repo_paths_json, local_updated_at, created_at, updated_at
			FROM tracker_tasks
			ORDER BY version_id ASC, sort_order ASC, id ASC
			`,
		)
		.all();
}

function listSubtaskRowsForTask(
	db: Database,
	versionId: string,
	taskId: string,
): TrackerTaskSubtaskRow[] {
	return db
		.query<TrackerTaskSubtaskRow, [string, string]>(
			`
			SELECT id, version_id, task_id, text, done, sort_order
			FROM tracker_task_subtasks
			WHERE version_id = ? AND task_id = ?
			ORDER BY sort_order ASC, id ASC
			`,
		)
		.all(versionId, taskId);
}

function listSpecRelationRowsForTask(
	db: Database,
	versionId: string,
	taskId: string,
): TrackerTaskSpecRelationRow[] {
	return db
		.query<TrackerTaskSpecRelationRow, [string, string]>(
			`
			SELECT id, version_id, task_id, standard_id, catalog_revision, path, href, title, level, relation, required, sort_order
			FROM tracker_task_spec_relations
			WHERE version_id = ? AND task_id = ?
			ORDER BY sort_order ASC, id ASC
			`,
		)
		.all(versionId, taskId);
}

export function getTrackerTask(
	versionId: string,
	taskId: string,
	db?: Database,
): TrackerTask | null {
	const database = db ?? getIssuesDatabase();
	const row = database
		.query<TrackerTaskRow, [string, string]>(
			`
			SELECT
				version_id, id, title, status_column, priority, workstream, domain, area, feature,
				owner, sort_order, deliverable_id, body, spec_approval, completed_at, source_json,
				repo_paths_json, local_updated_at, created_at, updated_at
			FROM tracker_tasks
			WHERE version_id = ? AND id = ?
			`,
		)
		.get(versionId, taskId);
	if (!row) return null;
	const subtasks = listSubtaskRowsForTask(database, versionId, taskId);
	const specRelations = listSpecRelationRowsForTask(database, versionId, taskId);
	return rowToTrackerTask(row, subtasks, specRelations);
}

export function listTrackerTasks(
	versionId?: string,
	db?: Database,
): TrackerTask[] {
	const database = db ?? getIssuesDatabase();
	return listTrackerTaskRows(database, versionId).map((row) => {
		const subtasks = listSubtaskRowsForTask(database, row.version_id, row.id);
		const specRelations = listSpecRelationRowsForTask(
			database,
			row.version_id,
			row.id,
		);
		return rowToTrackerTask(row, subtasks, specRelations);
	});
}

function getDeliverableTitle(
	db: Database,
	versionId: string,
	deliverableId: string | null,
): string | undefined {
	if (!deliverableId) return undefined;
	const row = db
		.query<Pick<TrackerDeliverableRow, "title">, [string, string]>(
			"SELECT title FROM tracker_deliverables WHERE version_id = ? AND id = ?",
		)
		.get(versionId, deliverableId);
	return row?.title;
}

export function listTrackerTasksForBoard(
	versionId?: string,
	db?: Database,
): TrackerTaskWithContext[] {
	const database = db ?? getIssuesDatabase();
	const rows = listTrackerTaskRows(database, versionId);
	return rows.map((row, index) => {
		const subtasks = listSubtaskRowsForTask(database, row.version_id, row.id);
		const specRelations = listSpecRelationRowsForTask(
			database,
			row.version_id,
			row.id,
		);
		const task = rowToTrackerTask(row, subtasks, specRelations);
		return {
			...task,
			deliverableTitle: getDeliverableTitle(
				database,
				row.version_id,
				row.deliverable_id,
			),
			displayNumber: row.sort_order ?? index + 1,
		};
	});
}

export function listTrackerDeliverables(
	versionId: string,
	db?: Database,
): TrackerDeliverable[] {
	const database = db ?? getIssuesDatabase();
	return database
		.query<TrackerDeliverableRow, [string]>(
			`
			SELECT version_id, id, title, description, closed_on, created_at, updated_at
			FROM tracker_deliverables
			WHERE version_id = ?
			ORDER BY id ASC
			`,
		)
		.all(versionId)
		.map(rowToTrackerDeliverable);
}

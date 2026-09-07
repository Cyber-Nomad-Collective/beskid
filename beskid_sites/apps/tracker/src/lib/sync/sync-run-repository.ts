import "@tanstack/react-start/server-only";

import { getIssuesDatabase } from "#/lib/storage/db";
import type {
	SyncLogLevel,
	SyncLogLine,
	SyncRunKind,
	SyncRunRecord,
	SyncRunStatus,
} from "#/lib/sync/sync-run-types";

export type {
	SyncLogLevel,
	SyncLogLine,
	SyncRunKind,
	SyncRunRecord,
	SyncRunStatus,
	SyncStatusPayload,
} from "#/lib/sync/sync-run-types";

export class SyncRunHandle {
	constructor(
		readonly id: string,
		readonly kind: SyncRunKind,
	) {}

	log(message: string, level: SyncLogLevel = "info"): void {
		appendSyncLog(this.id, level, message);
	}

	setPhase(phase: string): void {
		updateSyncRun(this.id, { phase });
		this.log(phase);
	}

	setProgress(current: number, total: number): void {
		updateSyncRun(this.id, {
			progressCurrent: current,
			progressTotal: total,
		});
	}

	complete(summary: string): void {
		updateSyncRun(this.id, {
			status: "success",
			finishedAt: new Date().toISOString(),
			summary,
		});
		this.log(summary);
	}

	fail(error: string): void {
		updateSyncRun(this.id, {
			status: "failed",
			finishedAt: new Date().toISOString(),
			error,
		});
		appendSyncLog(this.id, "error", error);
	}
}

export function createSyncRun(kind: SyncRunKind): SyncRunHandle {
	const id = crypto.randomUUID();
	const startedAt = new Date().toISOString();
	const db = getIssuesDatabase();
	db.run(
		`
		INSERT INTO sync_runs (
			id, kind, status, phase, progress_current, progress_total, started_at
		) VALUES (?, ?, 'running', 'Starting…', 0, 0, ?)
		`,
		[id, kind, startedAt],
	);
	appendSyncLog(id, "info", `Sync run started (${kind})`);
	return new SyncRunHandle(id, kind);
}

function updateSyncRun(
	id: string,
	patch: Partial<{
		status: SyncRunStatus;
		phase: string;
		progressCurrent: number;
		progressTotal: number;
		finishedAt: string;
		error: string;
		summary: string;
	}>,
): void {
	const db = getIssuesDatabase();
	const sets: string[] = [];
	const values: unknown[] = [];

	if (patch.status !== undefined) {
		sets.push("status = ?");
		values.push(patch.status);
	}
	if (patch.phase !== undefined) {
		sets.push("phase = ?");
		values.push(patch.phase);
	}
	if (patch.progressCurrent !== undefined) {
		sets.push("progress_current = ?");
		values.push(patch.progressCurrent);
	}
	if (patch.progressTotal !== undefined) {
		sets.push("progress_total = ?");
		values.push(patch.progressTotal);
	}
	if (patch.finishedAt !== undefined) {
		sets.push("finished_at = ?");
		values.push(patch.finishedAt);
	}
	if (patch.error !== undefined) {
		sets.push("error = ?");
		values.push(patch.error);
	}
	if (patch.summary !== undefined) {
		sets.push("summary = ?");
		values.push(patch.summary);
	}

	if (sets.length === 0) return;
	values.push(id);
	db.run(
		`UPDATE sync_runs SET ${sets.join(", ")} WHERE id = ?`,
		values as any[],
	);
}

export function appendSyncLog(
	runId: string,
	level: SyncLogLevel,
	message: string,
): void {
	const db = getIssuesDatabase();
	db.run(
		`
		INSERT INTO sync_log_lines (run_id, level, message, created_at)
		VALUES (?, ?, ?, ?)
		`,
		[runId, level, message, new Date().toISOString()],
	);
}

function mapRun(row: {
	id: string;
	kind: string;
	status: string;
	phase: string | null;
	progress_current: number;
	progress_total: number;
	started_at: string;
	finished_at: string | null;
	error: string | null;
	summary: string | null;
}): SyncRunRecord {
	return {
		id: row.id,
		kind: row.kind as SyncRunKind,
		status: row.status as SyncRunStatus,
		phase: row.phase,
		progressCurrent: row.progress_current,
		progressTotal: row.progress_total,
		startedAt: row.started_at,
		finishedAt: row.finished_at,
		error: row.error,
		summary: row.summary,
	};
}

export function getActiveSyncRun(): SyncRunRecord | null {
	const db = getIssuesDatabase();
	const row = db
		.query<
			{
				id: string;
				kind: string;
				status: string;
				phase: string | null;
				progress_current: number;
				progress_total: number;
				started_at: string;
				finished_at: string | null;
				error: string | null;
				summary: string | null;
			},
			[]
		>(
			`
			SELECT id, kind, status, phase, progress_current, progress_total,
			       started_at, finished_at, error, summary
			FROM sync_runs
			WHERE status = 'running'
			ORDER BY started_at DESC
			LIMIT 1
			`,
		)
		.get();
	return row ? mapRun(row) : null;
}

export function listRecentSyncRuns(limit = 8): SyncRunRecord[] {
	const db = getIssuesDatabase();
	return db
		.query<
			{
				id: string;
				kind: string;
				status: string;
				phase: string | null;
				progress_current: number;
				progress_total: number;
				started_at: string;
				finished_at: string | null;
				error: string | null;
				summary: string | null;
			},
			[number]
		>(
			`
			SELECT id, kind, status, phase, progress_current, progress_total,
			       started_at, finished_at, error, summary
			FROM sync_runs
			ORDER BY started_at DESC
			LIMIT ?
			`,
		)
		.all(limit)
		.map(mapRun);
}

export function getSyncRunById(runId: string): SyncRunRecord | null {
	const db = getIssuesDatabase();
	const row = db
		.query<
			{
				id: string;
				kind: string;
				status: string;
				phase: string | null;
				progress_current: number;
				progress_total: number;
				started_at: string;
				finished_at: string | null;
				error: string | null;
				summary: string | null;
			},
			[string]
		>(
			`
			SELECT id, kind, status, phase, progress_current, progress_total,
			       started_at, finished_at, error, summary
			FROM sync_runs
			WHERE id = ?
			`,
		)
		.get(runId);
	return row ? mapRun(row) : null;
}

export function listSyncLogsForRun(runId: string, limit = 200): SyncLogLine[] {
	return listSyncLogsForRunAfter(runId, 0, limit);
}

export function listSyncLogsForRunAfter(
	runId: string,
	afterLogId: number,
	limit = 200,
): SyncLogLine[] {
	const db = getIssuesDatabase();
	return db
		.query<
			{
				id: number;
				run_id: string;
				level: string;
				message: string;
				created_at: string;
			},
			[string, number, number]
		>(
			`
			SELECT id, run_id, level, message, created_at
			FROM sync_log_lines
			WHERE run_id = ? AND id > ?
			ORDER BY id ASC
			LIMIT ?
			`,
		)
		.all(runId, afterLogId, limit)
		.map((row) => ({
			id: row.id,
			runId: row.run_id,
			level: row.level as SyncLogLevel,
			message: row.message,
			createdAt: row.created_at,
		}));
}

export function pruneOldSyncRuns(keep = 40): void {
	const db = getIssuesDatabase();
	const stale = db
		.query<{ id: string }, [number]>(
			`
			SELECT id FROM sync_runs
			WHERE status != 'running'
			ORDER BY started_at DESC
			LIMIT -1 OFFSET ?
			`,
		)
		.all(keep);
	for (const row of stale) {
		db.run("DELETE FROM sync_log_lines WHERE run_id = ?", [row.id]);
		db.run("DELETE FROM sync_runs WHERE id = ?", [row.id]);
	}
}

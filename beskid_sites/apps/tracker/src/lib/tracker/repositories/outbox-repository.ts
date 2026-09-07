import "@tanstack/react-start/server-only";

import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import type {
	GithubSyncOperation,
	GithubSyncOutboxEntry,
	GithubSyncOutboxRow,
	TrackerEntityType,
} from "#/lib/tracker/types";

function nowIso(): string {
	return new Date().toISOString();
}

function mapOutboxRow(row: GithubSyncOutboxRow): GithubSyncOutboxEntry {
	let payload: Record<string, unknown> = {};
	try {
		payload = JSON.parse(row.payload_json) as Record<string, unknown>;
	} catch {
		payload = {};
	}
	return {
		id: row.id,
		entityType: row.entity_type as TrackerEntityType,
		entityId: row.entity_id,
		operation: row.operation as GithubSyncOperation,
		payload,
		attempts: row.attempts,
		lastError: row.last_error ?? undefined,
		createdAt: row.created_at,
	};
}

export interface EnqueueGithubSyncInput {
	entityType: TrackerEntityType;
	entityId: string;
	operation: GithubSyncOperation;
	payload?: Record<string, unknown>;
}

export function enqueueGithubSync(
	db: Database,
	input: EnqueueGithubSyncInput,
): string {
	const id = crypto.randomUUID();
	db.run(
		`
		INSERT INTO github_sync_outbox (
			id, entity_type, entity_id, operation, payload_json, attempts, last_error, created_at
		) VALUES (?, ?, ?, ?, ?, 0, NULL, ?)
		`,
		[
			id,
			input.entityType,
			input.entityId,
			input.operation,
			JSON.stringify(input.payload ?? {}),
			nowIso(),
		],
	);
	return id;
}

export function listGithubSyncOutbox(
	limit = 100,
	db?: Database,
): GithubSyncOutboxEntry[] {
	const database = db ?? getIssuesDatabase();
	return database
		.query<GithubSyncOutboxRow, [number]>(
			`
			SELECT id, entity_type, entity_id, operation, payload_json, attempts, last_error, created_at
			FROM github_sync_outbox
			ORDER BY created_at ASC
			LIMIT ?
			`,
		)
		.all(limit)
		.map(mapOutboxRow);
}

export function countGithubSyncOutbox(db?: Database): number {
	const database = db ?? getIssuesDatabase();
	const row = database
		.query<{ count: number }, []>(
			"SELECT COUNT(*) AS count FROM github_sync_outbox",
		)
		.get();
	return row?.count ?? 0;
}

export function markGithubSyncAttempt(
	id: string,
	error?: string,
	db?: Database,
): void {
	const database = db ?? getIssuesDatabase();
	database.run(
		`
		UPDATE github_sync_outbox
		SET attempts = attempts + 1, last_error = ?
		WHERE id = ?
		`,
		[error ?? null, id],
	);
}

export function deleteGithubSyncOutboxEntry(
	id: string,
	db?: Database,
): boolean {
	const database = db ?? getIssuesDatabase();
	const result = database.run("DELETE FROM github_sync_outbox WHERE id = ?", [
		id,
	]);
	return result.changes > 0;
}

import "@tanstack/react-start/server-only";

import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import { rowToGithubIssueLink } from "#/lib/tracker/mappers";
import type {
	GithubIssueLink,
	GithubIssueLinkRow,
	GithubSyncState,
	TrackerEntityType,
} from "#/lib/tracker/types";

function nowIso(): string {
	return new Date().toISOString();
}

export interface UpsertGithubIssueLinkInput {
	entityType: TrackerEntityType;
	entityId: string;
	githubNumber: number;
	githubUrl: string;
	githubUpdatedAt?: string;
	syncState?: GithubSyncState;
}

export function upsertGithubIssueLink(
	db: Database,
	input: UpsertGithubIssueLinkInput,
): void {
	const now = nowIso();
	db.run(
		`
		INSERT INTO github_issue_links (
			entity_type, entity_id, github_number, github_url, github_updated_at,
			last_synced_at, sync_state
		) VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(entity_type, entity_id) DO UPDATE SET
			github_number = excluded.github_number,
			github_url = excluded.github_url,
			github_updated_at = excluded.github_updated_at,
			last_synced_at = excluded.last_synced_at,
			sync_state = excluded.sync_state
		`,
		[
			input.entityType,
			input.entityId,
			input.githubNumber,
			input.githubUrl,
			input.githubUpdatedAt ?? null,
			now,
			input.syncState ?? "synced",
		],
	);
}

export function getGithubIssueLink(
	entityType: TrackerEntityType,
	entityId: string,
	db?: Database,
): GithubIssueLink | null {
	const database = db ?? getIssuesDatabase();
	const row = database
		.query<GithubIssueLinkRow, [string, string]>(
			`
			SELECT entity_type, entity_id, github_number, github_url, github_updated_at,
				last_synced_at, sync_state
			FROM github_issue_links
			WHERE entity_type = ? AND entity_id = ?
			`,
		)
		.get(entityType, entityId);
	return row ? rowToGithubIssueLink(row) : null;
}

export function getGithubIssueLinkByNumber(
	githubNumber: number,
	db?: Database,
): GithubIssueLink | null {
	const database = db ?? getIssuesDatabase();
	const row = database
		.query<GithubIssueLinkRow, [number]>(
			`
			SELECT entity_type, entity_id, github_number, github_url, github_updated_at,
				last_synced_at, sync_state
			FROM github_issue_links
			WHERE github_number = ?
			`,
		)
		.get(githubNumber);
	return row ? rowToGithubIssueLink(row) : null;
}

export function listGithubIssueLinks(
	entityType?: TrackerEntityType,
	db?: Database,
): GithubIssueLink[] {
	const database = db ?? getIssuesDatabase();
	if (entityType) {
		return database
			.query<GithubIssueLinkRow, [string]>(
				`
				SELECT entity_type, entity_id, github_number, github_url, github_updated_at,
					last_synced_at, sync_state
				FROM github_issue_links
				WHERE entity_type = ?
				ORDER BY github_number ASC
				`,
			)
			.all(entityType)
			.map(rowToGithubIssueLink);
	}
	return database
		.query<GithubIssueLinkRow, []>(
			`
			SELECT entity_type, entity_id, github_number, github_url, github_updated_at,
				last_synced_at, sync_state
			FROM github_issue_links
			ORDER BY github_number ASC
			`,
		)
		.all()
		.map(rowToGithubIssueLink);
}

export function deleteGithubIssueLink(
	entityType: TrackerEntityType,
	entityId: string,
	db?: Database,
): boolean {
	const database = db ?? getIssuesDatabase();
	const result = database.run(
		"DELETE FROM github_issue_links WHERE entity_type = ? AND entity_id = ?",
		[entityType, entityId],
	);
	return result.changes > 0;
}

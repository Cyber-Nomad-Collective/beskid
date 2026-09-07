import "@tanstack/react-start/server-only";

import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import { rowToTrackerBug } from "#/lib/tracker/mappers";
import { getGithubIssueLink } from "#/lib/tracker/repositories/github-links-repository";
import type {
	TrackerBug,
	TrackerBugRow,
	TrackerBugWithLink,
} from "#/lib/tracker/types";

function nowIso(): string {
	return new Date().toISOString();
}

export interface UpsertTrackerBugInput {
	id: string;
	title: string;
	body?: string;
	state?: "open" | "closed";
	author?: string;
	componentId?: string;
	subcomponentId?: string;
	fields?: Record<string, unknown>;
}

export function upsertTrackerBug(
	db: Database,
	input: UpsertTrackerBugInput,
): void {
	const now = nowIso();
	db.run(
		`
		INSERT INTO tracker_bugs (
			id, title, body, state, author, component_id, subcomponent_id, fields_json,
			local_updated_at, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			title = excluded.title,
			body = excluded.body,
			state = excluded.state,
			author = excluded.author,
			component_id = excluded.component_id,
			subcomponent_id = excluded.subcomponent_id,
			fields_json = excluded.fields_json,
			local_updated_at = excluded.local_updated_at,
			updated_at = excluded.updated_at
		`,
		[
			input.id,
			input.title,
			input.body ?? "",
			input.state ?? "open",
			input.author ?? null,
			input.componentId ?? null,
			input.subcomponentId ?? null,
			JSON.stringify(input.fields ?? {}),
			now,
			now,
			now,
		],
	);
}

export function listTrackerBugRows(
	db: Database,
	state?: "open" | "closed",
): TrackerBugRow[] {
	if (state) {
		return db
			.query<TrackerBugRow, [string]>(
				`
				SELECT
					id, title, body, state, author, component_id, subcomponent_id, fields_json,
					local_updated_at, created_at, updated_at
				FROM tracker_bugs
				WHERE state = ?
				ORDER BY created_at DESC
				`,
			)
			.all(state);
	}
	return db
		.query<TrackerBugRow, []>(
			`
			SELECT
				id, title, body, state, author, component_id, subcomponent_id, fields_json,
				local_updated_at, created_at, updated_at
			FROM tracker_bugs
			ORDER BY created_at DESC
			`,
		)
		.all();
}

export function getTrackerBug(bugId: string, db?: Database): TrackerBug | null {
	const database = db ?? getIssuesDatabase();
	const row = database
		.query<TrackerBugRow, [string]>(
			`
			SELECT
				id, title, body, state, author, component_id, subcomponent_id, fields_json,
				local_updated_at, created_at, updated_at
			FROM tracker_bugs
			WHERE id = ?
			`,
		)
		.get(bugId);
	return row ? rowToTrackerBug(row) : null;
}

export function listTrackerBugs(
	state?: "open" | "closed",
	db?: Database,
): TrackerBug[] {
	const database = db ?? getIssuesDatabase();
	return listTrackerBugRows(database, state).map(rowToTrackerBug);
}

export function listTrackerBugsWithLinks(
	state?: "open" | "closed",
	db?: Database,
): TrackerBugWithLink[] {
	const database = db ?? getIssuesDatabase();
	return listTrackerBugRows(database, state).map((row) => {
		const bug = rowToTrackerBug(row);
		const githubLink = getGithubIssueLink("bug", bug.id, database) ?? undefined;
		return { ...bug, githubLink };
	});
}

export interface ApplyInboundTrackerBugInput {
	title: string;
	body: string;
	state: "open" | "closed";
	author?: string;
	localUpdatedAt: string;
}

export function applyInboundTrackerBug(
	db: Database,
	bugId: string,
	input: ApplyInboundTrackerBugInput,
): void {
	const now = nowIso();
	const existing = db
		.query<{ id: string }, [string]>("SELECT id FROM tracker_bugs WHERE id = ?")
		.get(bugId);

	if (existing) {
		db.run(
			`
			UPDATE tracker_bugs SET
				title = ?,
				body = ?,
				state = ?,
				author = COALESCE(?, author),
				local_updated_at = ?,
				updated_at = ?
			WHERE id = ?
			`,
			[
				input.title,
				input.body,
				input.state,
				input.author ?? null,
				input.localUpdatedAt,
				now,
				bugId,
			],
		);
		return;
	}

	db.run(
		`
		INSERT INTO tracker_bugs (
			id, title, body, state, author, component_id, subcomponent_id, fields_json,
			local_updated_at, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, NULL, NULL, '{}', ?, ?, ?)
		`,
		[
			bugId,
			input.title,
			input.body,
			input.state,
			input.author ?? null,
			input.localUpdatedAt,
			now,
			now,
		],
	);
}

export function countTrackerBugs(db?: Database): {
	open: number;
	closed: number;
} {
	const database = db ?? getIssuesDatabase();
	const open =
		database
			.query<{ count: number }, [string]>(
				"SELECT COUNT(*) AS count FROM tracker_bugs WHERE state = ?",
			)
			.get("open")?.count ?? 0;
	const closed =
		database
			.query<{ count: number }, [string]>(
				"SELECT COUNT(*) AS count FROM tracker_bugs WHERE state = ?",
			)
			.get("closed")?.count ?? 0;
	return { open, closed };
}

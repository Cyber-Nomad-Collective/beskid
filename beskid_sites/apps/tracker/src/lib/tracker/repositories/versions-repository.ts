import "@tanstack/react-start/server-only";

import { normalizeVersionStatus } from "#/lib/roadmap/version-status";
import type { SeedVersion } from "#/lib/seed/schemas";
import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import { semverSortKey } from "#/lib/tracker/active-version";
import { rowToTrackerVersion } from "#/lib/tracker/mappers";
import type { TrackerVersion, TrackerVersionRow } from "#/lib/tracker/types";

function nowIso(): string {
	return new Date().toISOString();
}

export function upsertTrackerVersion(
	db: Database,
	version: SeedVersion,
	metadata: {
		visibility?: "internal" | "public";
		catalogRevision?: string;
	} = {},
): void {
	const now = nowIso();
	const status = normalizeVersionStatus(version.status);
	db.run(
		`
		INSERT INTO tracker_versions (
			id, title, summary, theme, status, cutoff_json, sort_key, visibility, catalog_revision, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			title = excluded.title,
			summary = excluded.summary,
			theme = excluded.theme,
			status = excluded.status,
			cutoff_json = excluded.cutoff_json,
			sort_key = excluded.sort_key,
			visibility = excluded.visibility,
			catalog_revision = excluded.catalog_revision,
			updated_at = excluded.updated_at
		`,
		[
			version.id,
			version.title,
			version.summary,
			version.theme,
			status,
			JSON.stringify(version.cutoff),
			semverSortKey(version.id),
			metadata.visibility ?? "internal",
			metadata.catalogRevision ?? null,
			now,
			now,
		],
	);
}

export function listTrackerVersionRows(db: Database): TrackerVersionRow[] {
	return db
		.query<TrackerVersionRow, []>(
			`
			SELECT id, title, summary, theme, status, cutoff_json, sort_key, visibility, catalog_revision, created_at, updated_at
			FROM tracker_versions
			ORDER BY sort_key ASC, id ASC
			`,
		)
		.all();
}

export function listTrackerVersions(db?: Database): TrackerVersion[] {
	const database = db ?? getIssuesDatabase();
	return listTrackerVersionRows(database).map(rowToTrackerVersion);
}

export function getTrackerVersion(
	versionId: string,
	db?: Database,
): TrackerVersion | null {
	const database = db ?? getIssuesDatabase();
	const row = database
		.query<TrackerVersionRow, [string]>(
			`
			SELECT id, title, summary, theme, status, cutoff_json, sort_key, visibility, catalog_revision, created_at, updated_at
			FROM tracker_versions
			WHERE id = ?
			`,
		)
		.get(versionId);
	return row ? rowToTrackerVersion(row) : null;
}

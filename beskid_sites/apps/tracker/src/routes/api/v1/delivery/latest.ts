import { createFileRoute } from "@tanstack/react-router";
import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import { listTrackerTasks } from "#/lib/tracker/repositories/tasks-repository";
import {
	getTrackerVersion,
	listTrackerVersions,
} from "#/lib/tracker/repositories/versions-repository";
import type { TrackerVersion } from "#/lib/tracker/types";

const CACHE_CONTROL = "public, max-age=300";

function publicSemver(versionId: string): string {
	const match = /^v(\d+)\.(\d+)$/.exec(versionId);
	return match ? `${match[1]}.${match[2]}.0` : versionId.replace(/^v/, "");
}

function trackerVersionId(version: string): string {
	const match = /^(?:v)?(\d+)\.(\d+)(?:\.0)?$/.exec(version);
	return match ? `v${match[1]}.${match[2]}` : version;
}

function isPublicReleased(version: TrackerVersion): boolean {
	return version.status === "Released" && version.visibility === "public";
}

function workstreamsForVersion(db: Database, versionId: string) {
	return db
		.query<{ slug: string; title: string; summary: string }, [string]>(
			"SELECT slug, title, summary FROM tracker_workstreams WHERE version_id = ? ORDER BY sort_order ASC, slug ASC",
		)
		.all(versionId);
}

function toDelivery(version: TrackerVersion, db: Database) {
	return {
		version: publicSemver(version.id),
		status: version.status,
		canonicalUrl: `/versions/${version.id}`,
		catalogRevision: version.catalogRevision,
		publishedAt: version.updatedAt,
		workstreams: workstreamsForVersion(db, version.id),
		tasks: listTrackerTasks(version.id, db).map((task) => ({
			id: task.id,
			title: task.title,
			workstream: task.workstream,
			specRelations: task.specRelations.map((relation) => ({
				standardId: relation.standardId,
				catalogRevision: relation.catalogRevision,
				relation: relation.relation,
			})),
			provenance: task.source,
		})),
	};
}

export async function latestDelivery(db: Database = getIssuesDatabase()) {
	const versions = listTrackerVersions(db).filter(isPublicReleased);
	const latest = versions.sort(
		(a, b) => b.sortKey - a.sortKey || b.id.localeCompare(a.id),
	)[0];
	return latest ? toDelivery(latest, db) : null;
}

export async function deliveryByVersion(db: Database, version: string) {
	const candidate = getTrackerVersion(trackerVersionId(version), db);
	return candidate && isPublicReleased(candidate)
		? toDelivery(candidate, db)
		: null;
}

export const Route = createFileRoute("/api/v1/delivery/latest")({
	server: {
		handlers: {
			GET: async () => {
				const delivery = await latestDelivery();
				return delivery
					? Response.json(delivery, { headers: { "Cache-Control": CACHE_CONTROL } })
					: Response.json({ error: "No public release" }, { status: 404 });
			},
		},
	},
});

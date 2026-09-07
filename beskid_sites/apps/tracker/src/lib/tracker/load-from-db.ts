import "@tanstack/react-start/server-only";

import { normalizeVersionStatus } from "#/lib/roadmap/version-status";
import type { LoadedVersionSeed } from "#/lib/seed/load";
import type {
	SeedDeliverable,
	SeedTask,
	SeedVersion,
	SeedWorkstream,
} from "#/lib/seed/schemas";
import { compareSeedDeliverables, compareSeedTasks } from "#/lib/seed/schemas";
import { getIssuesDatabase } from "#/lib/storage/db";
import {
	listTrackerDeliverables,
	listTrackerTasks,
} from "#/lib/tracker/repositories/tasks-repository";
import { listTrackerVersions } from "#/lib/tracker/repositories/versions-repository";
import type {
	TrackerTask,
	TrackerVersion,
	TrackerWorkstreamRow,
} from "#/lib/tracker/types";

function listTrackerWorkstreamRows(versionId: string): TrackerWorkstreamRow[] {
	const db = getIssuesDatabase();
	return db
		.query<TrackerWorkstreamRow, [string]>(
			`
			SELECT version_id, slug, title, summary, sort_order, created_at, updated_at
			FROM tracker_workstreams
			WHERE version_id = ?
			ORDER BY sort_order ASC, slug ASC
			`,
		)
		.all(versionId);
}

function versionToSeed(version: TrackerVersion): SeedVersion {
	return {
		id: version.id,
		title: version.title,
		summary: version.summary,
		theme: version.theme,
		status: normalizeVersionStatus(version.status),
		cutoff: version.cutoff,
	};
}

function workstreamToSeed(row: TrackerWorkstreamRow): SeedWorkstream {
	return {
		slug: row.slug,
		title: row.title,
		summary: row.summary,
		order: row.sort_order,
	};
}

function deliverableToSeed(deliverable: {
	id: string;
	title: string;
	description?: string;
	closedOn?: string;
}): SeedDeliverable {
	return {
		id: deliverable.id,
		title: deliverable.title,
		description: deliverable.description,
		closedOn: deliverable.closedOn,
		subtasks: [],
	};
}

function taskToSeed(task: TrackerTask): SeedTask {
	return {
		id: task.id,
		title: task.title,
		statusColumn: task.statusColumn,
		priority: task.priority,
		order: task.sortOrder ?? undefined,
		workstream: task.workstream,
		domain: task.domain,
		area: task.area,
		feature: task.feature,
		owner: task.owner,
		completedAt: task.completedAt,
		deliverableId: task.deliverableId,
		specRelations: task.specRelations.map((relation) => ({
			standardId: relation.standardId,
			catalogRevision: relation.catalogRevision,
			path: relation.path,
			href: relation.href,
			title: relation.title,
			level: relation.level,
			relation: relation.relation,
			required: relation.required,
		})),
		specApproval: task.specApproval,
		body: task.body,
		subtasks: task.subtasks.map((step) => ({
			text: step.text,
			done: step.done,
		})),
		source: task.source,
	};
}

export function loadVersionSeedFromDb(versionId: string): LoadedVersionSeed {
	const version = listTrackerVersions().find((entry) => entry.id === versionId);
	if (!version) {
		throw new Error(`Version ${versionId} not found in tracker database`);
	}

	const workstreams = listTrackerWorkstreamRows(versionId).map(workstreamToSeed);
	const deliverables = listTrackerDeliverables(versionId).map(deliverableToSeed);
	const tasks = listTrackerTasks(versionId).map(taskToSeed);

	workstreams.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	tasks.sort(compareSeedTasks);
	deliverables.sort(compareSeedDeliverables);

	return {
		version: versionToSeed(version),
		workstreams,
		deliverables,
		tasks,
	};
}

export function loadAllVersionSeedsFromDb(): LoadedVersionSeed[] {
	const versions = listTrackerVersions();
	if (versions.length === 0) return [];
	return versions.map((version) => loadVersionSeedFromDb(version.id));
}

export function hasTrackerCatalogData(): boolean {
	return listTrackerVersions().length > 0;
}

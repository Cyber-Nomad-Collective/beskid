import "@tanstack/react-start/server-only";

import { DEFAULT_DELIVERY_VERSIONS } from "#/lib/github/roadmap-labels";
import {
	emptyVersionStats,
	mergeStats,
	statsFromTasks,
} from "#/lib/roadmap/stats";
import type {
	RoadmapCatalog,
	RoadmapCatalogDeliverable,
	RoadmapCatalogTotals,
	RoadmapCatalogVersion,
	RoadmapCatalogWorkstream,
} from "#/lib/roadmap/types";
import type { VersionStatus } from "#/lib/roadmap/version-status";
import { type LoadedVersionSeed, loadAllVersionSeeds } from "#/lib/seed/load";
import type { SeedTask, SeedVersion } from "#/lib/seed/schemas";
import { resolveActiveVersionId } from "#/lib/tracker/active-version";
import {
	hasTrackerCatalogData,
	loadAllVersionSeedsFromDb,
} from "#/lib/tracker/load-from-db";

function inferStatus(version: SeedVersion): VersionStatus {
	if (version.status) return version.status;
	const today = new Date().toISOString().slice(0, 10);
	if (version.cutoff.endDate < today) return "Released";
	if (version.cutoff.startDate > today) return "Planned";
	return "In Progress";
}

function taskSliceStats(tasks: SeedTask[]) {
	let tasksDone = 0;
	let tasksInProgress = 0;
	for (const task of tasks) {
		if (task.statusColumn === "Done") tasksDone += 1;
		else if (task.statusColumn === "In Progress") tasksInProgress += 1;
	}
	return {
		tasksTotal: tasks.length,
		tasksDone,
		tasksInProgress,
	};
}

function buildVersionEntry(bundle: LoadedVersionSeed): RoadmapCatalogVersion {
	const { version, workstreams, deliverables, tasks } = bundle;
	const deliverablesClosed = deliverables.filter((d) => d.closedOn).length;
	const stats = statsFromTasks(
		tasks,
		deliverables.length,
		deliverablesClosed,
		workstreams.length,
	);

	const catalogDeliverables: RoadmapCatalogDeliverable[] = deliverables.map(
		(deliverable) => {
			const scoped = tasks.filter(
				(t) => (t.deliverableId ?? t.milestoneId) === deliverable.id,
			);
			const workstreamSlugs = [
				...new Set(
					scoped
						.map((t) => t.workstream)
						.filter((slug): slug is string => Boolean(slug)),
				),
			];
			return {
				id: deliverable.id,
				title: deliverable.title,
				description: deliverable.description,
				closedOn: deliverable.closedOn,
				workstreamSlugs,
				stats: taskSliceStats(scoped),
			};
		},
	);

	const catalogWorkstreams: RoadmapCatalogWorkstream[] = workstreams.map(
		(ws) => {
			const scoped = tasks.filter((t) => t.workstream === ws.slug);
			const deliverableIds = [
				...new Set(
					scoped
						.map((t) => t.deliverableId ?? t.milestoneId)
						.filter((id): id is string => Boolean(id)),
				),
			];
			return {
				slug: ws.slug,
				title: ws.title,
				summary: ws.summary,
				order: ws.order ?? 0,
				deliverableIds,
				stats: taskSliceStats(scoped),
			};
		},
	);

	return {
		id: version.id,
		title: version.title,
		summary: version.summary,
		theme: version.theme,
		status: inferStatus(version),
		cutoff: {
			startDate: version.cutoff.startDate,
			endDate: version.cutoff.endDate,
			endCommitSha: version.cutoff.endCommitSha,
		},
		deliverables: catalogDeliverables,
		workstreams: catalogWorkstreams,
		stats,
	};
}

function fallbackCatalog(): RoadmapCatalog {
	const versions: RoadmapCatalogVersion[] = DEFAULT_DELIVERY_VERSIONS.map(
		(id, index) => ({
			id,
			title: id,
			summary: "Delivery version (catalog not loaded on disk).",
			theme: "",
			status: (index < DEFAULT_DELIVERY_VERSIONS.length - 1
				? "Released"
				: "In Progress") as VersionStatus,
			cutoff: {
				startDate: "2026-01-01",
				endDate: "2026-12-31",
				endCommitSha: "0000000",
			},
			deliverables: [],
			workstreams: [],
			stats: emptyVersionStats(),
		}),
	);
	return {
		versions,
		totals: { ...emptyVersionStats(), versionsTotal: versions.length },
		activeVersionId: versions.at(-1)?.id ?? "v0.2",
	};
}

export function catalogWorkstreamSlugs(versionId: string): string[] {
	const catalog = buildRoadmapCatalog(versionId);
	const version = catalog.versions.find((v) => v.id === versionId);
	return version?.workstreams.map((w) => w.slug) ?? [];
}

function loadCatalogBundles(): LoadedVersionSeed[] {
	if (hasTrackerCatalogData()) {
		const fromDb = loadAllVersionSeedsFromDb();
		if (fromDb.length > 0) return fromDb;
	}
	return loadAllVersionSeeds();
}

export function buildRoadmapCatalog(
	preferredVersionId?: string,
): RoadmapCatalog {
	const bundles = loadCatalogBundles();
	if (bundles.length === 0) return fallbackCatalog();

	const versions = bundles.map(buildVersionEntry);
	let totals: RoadmapCatalogTotals = {
		...emptyVersionStats(),
		versionsTotal: versions.length,
	};
	for (const v of versions) {
		totals = {
			...mergeStats(totals, v.stats),
			versionsTotal: versions.length,
		};
	}

	const resolvedActive =
		resolveActiveVersionId(
			versions.map((version) => ({ id: version.id, status: version.status })),
		) ??
		versions.at(-1)?.id ??
		"v0.2";
	const activeVersionId =
		preferredVersionId && versions.some((v) => v.id === preferredVersionId)
			? preferredVersionId
			: resolvedActive;

	return { versions, totals, activeVersionId };
}

export function findCatalogVersion(
	catalog: RoadmapCatalog,
	versionId: string,
): RoadmapCatalogVersion | undefined {
	return catalog.versions.find((v) => v.id === versionId);
}

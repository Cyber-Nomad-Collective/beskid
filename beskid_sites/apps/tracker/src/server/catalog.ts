import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { RoadmapScopeNotFoundError } from "#/lib/roadmap/scope-not-found";
import type { RoadmapSearchHit } from "#/lib/roadmap/search-index";
import type {
	RoadmapCatalog,
	RoadmapCatalogVersion,
} from "#/lib/roadmap/types";
import { compareSeedTasks, type SeedTask } from "#/lib/seed/schemas";
import * as catalogServer from "#/server/catalog.server";

export const getRoadmapCatalog = createServerFn({ method: "GET" })
	.inputValidator(
		z
			.object({
				version: z.string().optional(),
			})
			.optional(),
	)
	.handler(async ({ data }): Promise<RoadmapCatalog> => {
		return catalogServer.buildCatalog(data?.version);
	});

export interface VersionDashboardPayload {
	version: RoadmapCatalogVersion;
	catalog: RoadmapCatalog;
	recentTasks: SeedTask[];
}

export const getVersionDashboard = createServerFn({ method: "GET" })
	.inputValidator(z.object({ version: z.string().min(1) }))
	.handler(async ({ data }): Promise<VersionDashboardPayload> => {
		const catalog = catalogServer.buildCatalog(data.version);
		const version = catalogServer.assertCatalogVersion(catalog, data.version);
		const recentTasks = [...catalogServer.seedTasksForVersion(data.version)]
			.sort((a, b) => compareSeedTasks(b, a))
			.slice(0, 12);
		return { version, catalog, recentTasks };
	});

export interface DeliverableDashboardPayload {
	version: RoadmapCatalogVersion;
	deliverable: RoadmapCatalogVersion["deliverables"][number];
	tasks: SeedTask[];
	catalog: RoadmapCatalog;
}

export const getDeliverableDashboard = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			version: z.string().min(1),
			deliverableId: z.string().min(1),
		}),
	)
	.handler(async ({ data }): Promise<DeliverableDashboardPayload> => {
		const catalog = catalogServer.buildCatalog(data.version);
		const version = catalogServer.assertCatalogVersion(catalog, data.version);
		const deliverable = version.deliverables.find(
			(d) => d.id === data.deliverableId,
		);
		if (!deliverable) {
			throw new RoadmapScopeNotFoundError(
				"deliverable",
				data.version,
				data.deliverableId,
			);
		}
		const tasks = catalogServer
			.seedTasksForVersion(data.version)
			.filter((t) => (t.deliverableId ?? t.milestoneId) === data.deliverableId)
			.sort(compareSeedTasks);
		return { version, deliverable, tasks, catalog };
	});

export const getMilestoneDashboard = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			version: z.string().min(1),
			milestoneId: z.string().min(1),
		}),
	)
	.handler(
		async ({ data }): Promise<DeliverableDashboardPayload> =>
			getDeliverableDashboard({
				data: { version: data.version, deliverableId: data.milestoneId },
			}),
	);

export interface WorkstreamDashboardPayload {
	version: RoadmapCatalogVersion;
	workstream: RoadmapCatalogVersion["workstreams"][number];
	tasks: SeedTask[];
	catalog: RoadmapCatalog;
}

export const getWorkstreamDashboard = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			version: z.string().min(1),
			slug: z.string().min(1),
		}),
	)
	.handler(async ({ data }): Promise<WorkstreamDashboardPayload> => {
		const catalog = catalogServer.buildCatalog(data.version);
		const version = catalogServer.assertCatalogVersion(catalog, data.version);
		const workstream = version.workstreams.find((w) => w.slug === data.slug);
		if (!workstream) {
			throw new RoadmapScopeNotFoundError("workstream", data.version, data.slug);
		}
		const tasks = catalogServer
			.seedTasksForVersion(data.version)
			.filter((t) => t.workstream === data.slug)
			.sort(compareSeedTasks);
		return { version, workstream, tasks, catalog };
	});

export interface TaxonomyDashboardPayload {
	version: RoadmapCatalogVersion;
	slug: string;
	tasks: SeedTask[];
	catalog: RoadmapCatalog;
}

function taxonomyDashboard(
	versionId: string,
	scope: "domain" | "area" | "feature",
	slug: string,
): TaxonomyDashboardPayload {
	const catalog = catalogServer.buildCatalog(versionId);
	const version = catalogServer.assertCatalogVersion(catalog, versionId);
	const tasks = catalogServer
		.seedTasksForVersion(versionId)
		.filter((t) => catalogServer.taskMatchesScope(t, scope, slug))
		.sort(compareSeedTasks);
	catalogServer.assertScopeSlugInVersion(versionId, scope, slug, tasks);
	return { version, slug, tasks, catalog };
}

export const getDomainDashboard = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			version: z.string().min(1),
			slug: z.string().min(1),
		}),
	)
	.handler(
		async ({ data }): Promise<TaxonomyDashboardPayload> =>
			taxonomyDashboard(data.version, "domain", data.slug),
	);

export const getAreaDashboard = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			version: z.string().min(1),
			slug: z.string().min(1),
		}),
	)
	.handler(
		async ({ data }): Promise<TaxonomyDashboardPayload> =>
			taxonomyDashboard(data.version, "area", data.slug),
	);

export const getFeatureDashboard = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			version: z.string().min(1),
			slug: z.string().min(1),
		}),
	)
	.handler(
		async ({ data }): Promise<TaxonomyDashboardPayload> =>
			taxonomyDashboard(data.version, "feature", data.slug),
	);

export const getRoadmapSearchIndex = createServerFn({ method: "GET" }).handler(
	async (): Promise<RoadmapSearchHit[]> =>
		catalogServer.loadRoadmapSearchIndex(),
);

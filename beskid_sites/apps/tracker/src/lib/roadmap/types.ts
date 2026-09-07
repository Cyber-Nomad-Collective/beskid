import type { VersionStatus } from "#/lib/roadmap/version-status";
import type { SeedDeliverable, SeedWorkstream } from "#/lib/seed/schemas";

export interface RoadmapVersionStats {
	tasksTotal: number;
	tasksDone: number;
	tasksInProgress: number;
	tasksBacklog: number;
	deliverablesTotal: number;
	deliverablesClosed: number;
	workstreamsTotal: number;
	commitsTracked: number;
}

export interface RoadmapCatalogDeliverable {
	id: string;
	title: string;
	description?: string;
	closedOn?: string;
	workstreamSlugs: string[];
	stats: Pick<
		RoadmapVersionStats,
		"tasksTotal" | "tasksDone" | "tasksInProgress"
	>;
}

export interface RoadmapCatalogWorkstream {
	slug: string;
	title: string;
	summary: string;
	order: number;
	deliverableIds: string[];
	stats: Pick<
		RoadmapVersionStats,
		"tasksTotal" | "tasksDone" | "tasksInProgress"
	>;
}

export interface RoadmapCatalogVersion {
	id: string;
	title: string;
	summary: string;
	theme: string;
	status: VersionStatus;
	cutoff: {
		startDate: string;
		endDate: string;
		endCommitSha: string;
	};
	deliverables: RoadmapCatalogDeliverable[];
	workstreams: RoadmapCatalogWorkstream[];
	stats: RoadmapVersionStats;
}

export interface RoadmapCatalogTotals extends RoadmapVersionStats {
	versionsTotal: number;
}

export interface RoadmapCatalog {
	versions: RoadmapCatalogVersion[];
	totals: RoadmapCatalogTotals;
	activeVersionId: string;
}

export type CatalogDeliverable = SeedDeliverable;
export type CatalogWorkstream = SeedWorkstream;

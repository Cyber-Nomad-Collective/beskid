import type { BoardFilters } from "#/lib/github/filters";
import { RoadmapScopeNotFoundError } from "#/lib/roadmap/scope-not-found";

export function assertBoardFilters(
	filters: BoardFilters,
	meta: {
		workstreams: string[];
		domains: string[];
		areas: string[];
		features: string[];
	},
	catalogWorkstreamSlugs: string[] = [],
): void {
	const knownWorkstreams = new Set([
		...meta.workstreams,
		...catalogWorkstreamSlugs,
	]);
	if (filters.workstream && !knownWorkstreams.has(filters.workstream)) {
		throw new RoadmapScopeNotFoundError(
			"workstream",
			filters.version,
			filters.workstream,
		);
	}
	if (filters.domain && !meta.domains.includes(filters.domain)) {
		throw new RoadmapScopeNotFoundError(
			"domain",
			filters.version,
			filters.domain,
		);
	}
	if (filters.area && !meta.areas.includes(filters.area)) {
		throw new RoadmapScopeNotFoundError("area", filters.version, filters.area);
	}
	if (filters.feature && !meta.features.includes(filters.feature)) {
		throw new RoadmapScopeNotFoundError(
			"feature",
			filters.version,
			filters.feature,
		);
	}
}

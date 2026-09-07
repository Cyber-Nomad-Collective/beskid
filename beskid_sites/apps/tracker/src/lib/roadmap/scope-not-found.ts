export type RoadmapScopeKind =
	| "version"
	| "deliverable"
	| "milestone"
	| "workstream"
	| "domain"
	| "area"
	| "feature";

export class RoadmapScopeNotFoundError extends Error {
	readonly scope: RoadmapScopeKind;
	readonly versionId: string;
	readonly slug: string;

	constructor(scope: RoadmapScopeKind, versionId: string, slug: string) {
		super(`Unknown ${scope}: ${slug} (version ${versionId})`);
		this.name = "RoadmapScopeNotFoundError";
		this.scope = scope;
		this.versionId = versionId;
		this.slug = slug;
	}
}

const SCOPE_NOT_FOUND_MESSAGE =
	/^Unknown (version|deliverable|milestone|workstream|domain|area|feature): (.+) \(version (v[\d.]+)\)$/;

export function parseRoadmapScopeNotFound(
	error: unknown,
): RoadmapScopeNotFoundError | null {
	if (error instanceof RoadmapScopeNotFoundError) return error;
	if (error instanceof Error) {
		const match = error.message.match(SCOPE_NOT_FOUND_MESSAGE);
		if (match) {
			return new RoadmapScopeNotFoundError(
				match[1] as RoadmapScopeKind,
				match[3]!,
				match[2]!,
			);
		}
	}
	return null;
}

export function isRoadmapScopeNotFound(
	error: unknown,
): error is RoadmapScopeNotFoundError {
	return parseRoadmapScopeNotFound(error) !== null;
}

export function scopeKindLabel(scope: RoadmapScopeKind): string {
	switch (scope) {
		case "version":
			return "Delivery version";
		case "deliverable":
			return "Deliverable";
		case "milestone":
			return "Deliverable";
		case "workstream":
			return "Workstream";
		case "domain":
			return "Domain";
		case "area":
			return "Area";
		case "feature":
			return "Feature";
	}
}

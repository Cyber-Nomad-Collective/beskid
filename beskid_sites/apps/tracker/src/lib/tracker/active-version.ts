import type { VersionStatus } from "#/lib/roadmap/version-status";

export interface SemverVersion {
	major: number;
	minor: number;
}

export interface ActiveVersionCandidate {
	id: string;
	status: VersionStatus | string;
}

const VERSION_ID_PATTERN = /^v(\d+)\.(\d+)$/;

export function parseSemverVersion(versionId: string): SemverVersion | null {
	const match = VERSION_ID_PATTERN.exec(versionId);
	if (!match) return null;
	return {
		major: Number.parseInt(match[1], 10),
		minor: Number.parseInt(match[2], 10),
	};
}

export function compareSemverVersion(a: string, b: string): number {
	const parsedA = parseSemverVersion(a);
	const parsedB = parseSemverVersion(b);
	if (!parsedA && !parsedB) return a.localeCompare(b);
	if (!parsedA) return -1;
	if (!parsedB) return 1;
	if (parsedA.major !== parsedB.major) return parsedA.major - parsedB.major;
	if (parsedA.minor !== parsedB.minor) return parsedA.minor - parsedB.minor;
	return 0;
}

export function semverSortKey(versionId: string): number {
	const parsed = parseSemverVersion(versionId);
	if (!parsed) return 0;
	return parsed.major * 1000 + parsed.minor;
}

/**
 * Active version rule: prefer "In Progress" versions (highest semver among them);
 * if none, pick highest semver overall.
 */
export function resolveActiveVersionId(
	versions: ActiveVersionCandidate[],
): string | null {
	if (versions.length === 0) return null;

	const inProgress = versions.filter((v) => v.status === "In Progress");
	const pool = inProgress.length > 0 ? inProgress : versions;
	const sorted = [...pool].sort((a, b) => compareSemverVersion(b.id, a.id));
	return sorted[0]?.id ?? null;
}

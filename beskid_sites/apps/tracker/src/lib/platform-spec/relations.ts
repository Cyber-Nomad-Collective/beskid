import { beskidDocsUrl } from "#/lib/beskid-docs-origin";

export const SPEC_RELATION_TYPES = [
	"implements",
	"depends-on",
	"tracks",
	"extends",
	"validates",
] as const;

export type SpecRelationType = (typeof SPEC_RELATION_TYPES)[number];

export interface SpecRelation {
	standardId?: string;
	path: string;
	href: string;
	title?: string;
	level?: string;
	relation: SpecRelationType;
	required: boolean;
}

export function specPathToHref(path: string): string {
	return beskidDocsUrl(path);
}

export function hierarchyFromSlug(slug: string): {
	domain?: string;
	area?: string;
	feature?: string;
	level: string;
} {
	const parts = slug.split("/").filter(Boolean);
	if (parts[0] !== "platform-spec") {
		return { level: "unknown" };
	}
	const level =
		parts.length <= 2 ? "domain" : parts.length === 3 ? "area" : "feature";
	return {
		domain: parts[1],
		area: parts.length >= 3 ? parts[2] : undefined,
		feature: parts.length >= 4 ? parts[3] : undefined,
		level,
	};
}

export function mergeLegacySpecLinks(
	relations: SpecRelation[],
	legacyPaths: { path: string; title?: string }[],
): SpecRelation[] {
	const seen = new Set(relations.map((r) => r.path));
	const merged = [...relations];
	for (const link of legacyPaths) {
		if (seen.has(link.path)) continue;
		seen.add(link.path);
		const hierarchy = hierarchyFromSlug(
			link.path.replace(/^\//, "").replace(/\/$/, "") ||
				link.path.replace(/^\/platform-spec\//, "platform-spec/"),
		);
		merged.push({
			path: link.path,
			href: specPathToHref(link.path),
			title: link.title,
			level: hierarchy.level,
			relation: "tracks",
			required: false,
		});
	}
	return merged;
}

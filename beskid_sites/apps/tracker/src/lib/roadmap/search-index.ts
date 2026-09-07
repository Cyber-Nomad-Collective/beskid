export type RoadmapSearchHitKind =
	| "version"
	| "deliverable"
	| "workstream"
	| "task"
	| "nav";

export interface RoadmapSearchHit {
	id: string;
	kind: RoadmapSearchHitKind;
	title: string;
	subtitle: string;
	versionId?: string;
	/** TanStack route `to` */
	to: string;
	params?: Record<string, string>;
	search?: { q?: string; workstream?: string };
	keywords: string;
}

function hitScore(haystack: string, query: string): number {
	const h = haystack.toLowerCase();
	const q = query.toLowerCase().trim();
	if (!q) return 0;
	if (h === q) return 100;
	if (h.startsWith(q)) return 80;
	if (h.includes(q)) return 50;
	const words = q.split(/\s+/).filter(Boolean);
	if (words.every((w) => h.includes(w))) return 40;
	return 0;
}

export function searchRoadmapIndex(
	hits: RoadmapSearchHit[],
	rawQuery: string,
	limit = 12,
): RoadmapSearchHit[] {
	const q = rawQuery.trim();
	if (!q) return hits.filter((h) => h.kind === "nav").slice(0, limit);

	return hits
		.map((hit) => ({ hit, score: hitScore(`${hit.keywords} ${hit.title}`, q) }))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((entry) => entry.hit);
}

import type { RoadmapTask } from "#/lib/github/types";
import type { FlatSpecNavEntry } from "#/lib/platform-spec/nav";

const STOP_WORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"by",
	"for",
	"from",
	"in",
	"is",
	"it",
	"of",
	"on",
	"or",
	"that",
	"the",
	"this",
	"to",
	"with",
]);

export interface PlatformSpecSuggestion {
	entry: FlatSpecNavEntry;
	score: number;
	matchedTerms: string[];
	alreadyLinked: boolean;
}

function tokenize(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.toLowerCase()
		.split(/[^a-z0-9]+/g)
		.map((term) => term.trim())
		.filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}

function incrementWeight(
	weights: Map<string, number>,
	terms: string[],
	weight: number,
): void {
	for (const term of terms) {
		weights.set(term, (weights.get(term) ?? 0) + weight);
	}
}

function buildTermWeights(task: RoadmapTask): Map<string, number> {
	const weights = new Map<string, number>();
	incrementWeight(weights, tokenize(task.title), 4);
	incrementWeight(weights, tokenize(task.body), 2);
	incrementWeight(weights, tokenize(task.workstream), 3);
	incrementWeight(weights, tokenize(task.domain), 5);
	incrementWeight(weights, tokenize(task.area), 5);
	incrementWeight(weights, tokenize(task.feature), 6);
	return weights;
}

function scopeScore(entry: FlatSpecNavEntry, task: RoadmapTask): number {
	let score = 0;
	if (task.domain && entry.domain === task.domain) score += 80;
	if (task.area && entry.area === task.area) score += 90;
	if (task.feature && entry.feature === task.feature) score += 120;
	return score;
}

function lexicalScore(
	entry: FlatSpecNavEntry,
	termWeights: Map<string, number>,
): { score: number; matchedTerms: string[] } {
	let score = 0;
	const matchedTerms: string[] = [];
	const title = entry.title.toLowerCase();
	const slug = entry.slug.toLowerCase();
	const href = entry.href.toLowerCase();

	for (const [term, weight] of termWeights.entries()) {
		let termMatched = false;
		if (title.includes(term)) {
			score += weight * 5;
			termMatched = true;
		}
		if (slug.includes(term)) {
			score += weight * 4;
			termMatched = true;
		}
		if (href.includes(term)) {
			score += weight * 2;
			termMatched = true;
		}
		if (termMatched) matchedTerms.push(term);
	}

	return { score, matchedTerms };
}

export function suggestPlatformSpecEntriesForTask(
	entries: FlatSpecNavEntry[],
	task: RoadmapTask,
	limit = 8,
): PlatformSpecSuggestion[] {
	const linkedPaths = new Set(
		task.specRelations.map((relation) => relation.path.replace(/\/+$/, "")),
	);
	const termWeights = buildTermWeights(task);

	return entries
		.map((entry): PlatformSpecSuggestion => {
			const scope = scopeScore(entry, task);
			const lexical = lexicalScore(entry, termWeights);
			const normalizedPath = entry.href.replace(/\/+$/, "");
			return {
				entry,
				score: scope + lexical.score,
				matchedTerms: lexical.matchedTerms.sort(),
				alreadyLinked: linkedPaths.has(normalizedPath),
			};
		})
		.filter((suggestion) => suggestion.score > 0)
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			if (a.entry.level !== b.entry.level) {
				// Prefer concrete nodes when scores tie.
				const rank = { feature: 0, area: 1, domain: 2, root: 3 } as const;
				return (
					(rank[a.entry.level as keyof typeof rank] ?? 4) -
					(rank[b.entry.level as keyof typeof rank] ?? 4)
				);
			}
			return a.entry.href.localeCompare(b.entry.href);
		})
		.slice(0, Math.max(1, limit));
}

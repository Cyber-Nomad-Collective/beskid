import type {
	PublicBug,
	RoadmapColumns,
	RoadmapTask,
} from "#/lib/github/types";

import {
	metaQueryIsEmpty,
	type ParsedMetaQuery,
	parseMetaQuery,
} from "#/lib/roadmap/meta-search-query";

export type { ParsedMetaQuery } from "#/lib/roadmap/meta-search-query";
export {
	formatMetaQueryHint,
	metaQueryIsEmpty,
	parseMetaQuery,
} from "#/lib/roadmap/meta-search-query";

function textMatches(haystack: string, needle: string): boolean {
	return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function taskMatchesMetaQuery(
	task: RoadmapTask,
	query: ParsedMetaQuery,
): boolean {
	if (metaQueryIsEmpty(query)) return true;

	if (query.issue !== undefined && task.number !== query.issue) return false;
	if (query.workstream && task.workstream !== query.workstream) return false;
	if (query.domain && task.domain !== query.domain) return false;
	if (query.area && task.area !== query.area) return false;
	if (query.feature && task.feature !== query.feature) return false;
	if (query.status && task.statusColumn !== query.status) return false;
	if (query.priority && task.priority !== query.priority) return false;
	if (query.owner && !textMatches(task.owner, query.owner)) return false;

	if (query.specLinked === true && task.specRelations.length === 0) {
		return false;
	}
	if (query.specLinked === false && task.specRelations.length > 0) {
		return false;
	}

	if (query.text) {
		const specText = task.specRelations
			.map((r) => `${r.path} ${r.title ?? ""}`)
			.join(" ");
		const blob = [
			task.title,
			task.body,
			task.workstream ?? "",
			task.domain ?? "",
			task.area ?? "",
			task.feature ?? "",
			specText,
			String(task.number),
		].join(" ");
		if (!textMatches(blob, query.text)) return false;
	}

	return true;
}

export function filterTasksByMetaQuery(
	tasks: RoadmapTask[],
	rawQuery: string,
): RoadmapTask[] {
	const parsed = parseMetaQuery(rawQuery);
	if (metaQueryIsEmpty(parsed)) return tasks;
	return tasks.filter((task) => taskMatchesMetaQuery(task, parsed));
}

export function filterColumnsByMetaQuery(
	columns: RoadmapColumns,
	rawQuery: string,
): RoadmapColumns {
	const next = { ...columns } as RoadmapColumns;
	for (const key of Object.keys(next) as (keyof RoadmapColumns)[]) {
		next[key] = filterTasksByMetaQuery(next[key], rawQuery);
	}
	return next;
}

export function bugMatchesMetaQuery(
	bug: PublicBug,
	query: ParsedMetaQuery,
): boolean {
	if (metaQueryIsEmpty(query)) return true;
	if (query.issue !== undefined && bug.number !== query.issue) return false;
	if (query.text) {
		const blob = [
			bug.title,
			bug.bodyExcerpt,
			bug.author ?? "",
			...bug.labels,
		].join(" ");
		if (!textMatches(blob, query.text)) return false;
	}
	return true;
}

export function filterBugsByMetaQuery(
	bugs: PublicBug[],
	rawQuery: string,
): PublicBug[] {
	const parsed = parseMetaQuery(rawQuery);
	if (metaQueryIsEmpty(parsed)) return bugs;
	return bugs.filter((bug) => bugMatchesMetaQuery(bug, parsed));
}

export function activeMetaFilterChips(
	rawQuery: string,
): { key: string; label: string; removeToken: string }[] {
	const parsed = parseMetaQuery(rawQuery);
	const chips: { key: string; label: string; removeToken: string }[] = [];

	const add = (key: string, label: string, tokenPrefix: string) => {
		chips.push({ key, label, removeToken: `${tokenPrefix}` });
	};

	if (parsed.workstream)
		add(
			"workstream",
			`Workstream: ${parsed.workstream}`,
			`workstream:${parsed.workstream}`,
		);
	if (parsed.domain)
		add("domain", `Domain: ${parsed.domain}`, `domain:${parsed.domain}`);
	if (parsed.area) add("area", `Area: ${parsed.area}`, `area:${parsed.area}`);
	if (parsed.feature)
		add("feature", `Feature: ${parsed.feature}`, `feature:${parsed.feature}`);
	if (parsed.status)
		add("status", `Status: ${parsed.status}`, `status:${parsed.status}`);
	if (parsed.priority)
		add(
			"priority",
			`Priority: ${parsed.priority}`,
			`priority:${parsed.priority}`,
		);
	if (parsed.owner)
		add("owner", `Owner: @${parsed.owner}`, `owner:${parsed.owner}`);
	if (parsed.issue) add("issue", `#${parsed.issue}`, `#${parsed.issue}`);
	if (parsed.specLinked === true) add("spec", "Spec linked", "spec:linked");
	if (parsed.specLinked === false) add("spec", "No spec link", "spec:none");
	if (parsed.text) add("text", `"${parsed.text}"`, parsed.text);

	return chips;
}

export function removeTokenFromQuery(raw: string, token: string): string {
	return raw.replace(token, " ").replace(/\s+/g, " ").trim();
}

import { parseMetaQuery } from "#/lib/roadmap/meta-search-query";

export type FilterRule = {
	field?: string | number;
	value?: unknown;
	includes?: unknown[];
	rules?: FilterRule[];
};

export interface FilterSetValue {
	glue?: "and" | "or";
	rules?: FilterRule[];
}

export interface RoadmapFilterFieldOptions {
	workstreams?: string[];
	domains?: string[];
	areas?: string[];
	features?: string[];
}

function readRuleValue(rule: FilterRule | undefined): string | undefined {
	if (!rule) return undefined;
	if (typeof rule.value === "string" && rule.value.trim()) {
		return rule.value.trim();
	}
	if (Array.isArray(rule.includes) && typeof rule.includes[0] === "string") {
		const value = rule.includes[0].trim();
		return value || undefined;
	}
	return undefined;
}

function flattenRules(rules: FilterRule[] | undefined): FilterRule[] {
	if (!rules) return [];
	return rules.flatMap((rule) =>
		rule.rules ? flattenRules(rule.rules) : [rule],
	);
}

export function buildQueryFromFilterValue(filterValue: FilterSetValue): string {
	const rules = flattenRules(filterValue.rules);
	const byField = new Map<string, FilterRule>();
	for (const rule of rules) {
		if (typeof rule.field === "string" && !byField.has(rule.field)) {
			byField.set(rule.field, rule);
		}
	}

	const text = readRuleValue(byField.get("text"));
	const parts: string[] = [];
	if (text) parts.push(text);

	const tokenFields = [
		"workstream",
		"domain",
		"area",
		"feature",
		"status",
		"priority",
		"owner",
		"spec",
	] as const;
	for (const field of tokenFields) {
		const tokenValue = readRuleValue(byField.get(field));
		if (tokenValue) parts.push(`${field}:${tokenValue}`);
	}

	return parts.join(" ").trim();
}

export function buildFilterValueFromQuery(
	value: string,
	showStructuredFilters: boolean,
): FilterSetValue {
	const parsed = parseMetaQuery(value);
	const rules: FilterRule[] = [];

	if (parsed.text) {
		rules.push({ field: "text", value: parsed.text });
	}

	if (!showStructuredFilters) {
		return { glue: "and", rules };
	}

	if (parsed.workstream) {
		rules.push({ field: "workstream", value: parsed.workstream });
	}
	if (parsed.domain) rules.push({ field: "domain", value: parsed.domain });
	if (parsed.area) rules.push({ field: "area", value: parsed.area });
	if (parsed.feature) rules.push({ field: "feature", value: parsed.feature });
	if (parsed.status) rules.push({ field: "status", value: parsed.status });
	if (parsed.priority) {
		rules.push({ field: "priority", value: parsed.priority });
	}
	if (parsed.owner) rules.push({ field: "owner", value: parsed.owner });
	if (parsed.specLinked === true) {
		rules.push({ field: "spec", value: "linked" });
	}
	if (parsed.specLinked === false) {
		rules.push({ field: "spec", value: "none" });
	}

	return { glue: "and", rules };
}

export function buildRoadmapFilterFields(
	options: RoadmapFilterFieldOptions,
	showStructuredFilters = true,
) {
	const structuredFields = showStructuredFilters
		? [
				{
					id: "workstream",
					label: "Workstream",
					type: "select" as const,
					options: options.workstreams ?? [],
				},
				{
					id: "domain",
					label: "Domain",
					type: "select" as const,
					options: options.domains ?? [],
				},
				{
					id: "area",
					label: "Area",
					type: "select" as const,
					options: options.areas ?? [],
				},
				{
					id: "feature",
					label: "Feature",
					type: "select" as const,
					options: options.features ?? [],
				},
				{
					id: "status",
					label: "Status",
					type: "select" as const,
					options: ["Backlog", "In Progress", "Done"],
				},
				{
					id: "priority",
					label: "Priority",
					type: "select" as const,
					options: ["high", "medium", "low"],
				},
				{ id: "owner", label: "Owner", type: "text" as const },
				{
					id: "spec",
					label: "Spec linkage",
					type: "select" as const,
					options: ["linked", "none"],
				},
			]
		: [];

	return [
		{ id: "text", label: "Search", type: "text" as const },
		...structuredFields,
	];
}

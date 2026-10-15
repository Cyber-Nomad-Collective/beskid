import type { PackageKind, PackageSummary } from "#/lib/pckg-api";

export type KindFilter = "all" | PackageKind;
export type PackageSort = "name" | "updated" | "downloads";

export const KIND_FILTERS: { value: KindFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "library", label: "Libraries" },
	{ value: "template", label: "Templates" },
	{ value: "tool", label: "Tools" },
];

export const PACKAGE_SORTS: { value: PackageSort; label: string }[] = [
	{ value: "name", label: "Name" },
	{ value: "updated", label: "Recently updated" },
	{ value: "downloads", label: "Most downloaded" },
];

export function parseKindFilter(value: unknown): KindFilter {
	return KIND_FILTERS.some((filter) => filter.value === value)
		? (value as KindFilter)
		: "all";
}

export function parsePackageSort(value: unknown): PackageSort {
	return PACKAGE_SORTS.some((sort) => sort.value === value)
		? (value as PackageSort)
		: "name";
}

/** Every term must appear in the name, description, category, or a tag. */
export function matchesQuery(item: PackageSummary, query: string): boolean {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (terms.length === 0) return true;
	const haystack = [item.name, item.description, item.category, ...item.tags]
		.join("\n")
		.toLowerCase();
	return terms.every((term) => haystack.includes(term));
}

export function filterPackages(
	items: PackageSummary[],
	options: { query: string; kind: KindFilter; sort: PackageSort },
): PackageSummary[] {
	const matching = items.filter(
		(item) =>
			(options.kind === "all" || item.packageKind === options.kind) &&
			matchesQuery(item, options.query),
	);
	const byName = (a: PackageSummary, b: PackageSummary) =>
		a.name.localeCompare(b.name, "en");
	return matching.sort((a, b) => {
		switch (options.sort) {
			case "updated":
				return b.updatedAtUtc.localeCompare(a.updatedAtUtc) || byName(a, b);
			case "downloads":
				return b.totalDownloads - a.totalDownloads || byName(a, b);
			default:
				return byName(a, b);
		}
	});
}

/** Per-kind counts for the items that match the query. */
export function kindCounts(
	items: PackageSummary[],
	query: string,
): Record<KindFilter, number> {
	const counts: Record<KindFilter, number> = {
		all: 0,
		library: 0,
		template: 0,
		tool: 0,
	};
	for (const item of items) {
		if (!matchesQuery(item, query)) continue;
		counts.all += 1;
		counts[item.packageKind] += 1;
	}
	return counts;
}

/** The `corelib` aggregate and its `corelib_*` workspace members. */
export function isStandardLibrary(item: PackageSummary): boolean {
	return item.name === "corelib" || item.name.startsWith("corelib_");
}

/** Tags worth showing: every package carries `beskid`, so it says nothing. */
export function visibleTags(item: PackageSummary, max = 4): string[] {
	return item.tags.filter((tag) => tag !== "beskid").slice(0, max);
}

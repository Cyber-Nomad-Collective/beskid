import type { FlatSpecNavEntry } from "#/lib/platform-spec/nav";

type UnknownRecord = Record<string, unknown>;

export interface OpenSpecCatalogNavResult {
	revision?: string;
	entries: FlatSpecNavEntry[];
}

function asRecord(value: unknown): UnknownRecord | null {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? (value as UnknownRecord)
		: null;
}

function firstString(
	record: UnknownRecord,
	keys: string[],
): string | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return undefined;
}

function stringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === "string");
}

function normalizeSlug(value: string): string {
	return value
		.replace(/^https?:\/\/[^/]+/i, "")
		.replace(/^\/+/, "")
		.replace(/\/+$/, "");
}

function legacySlugs(record: UnknownRecord): string[] {
	const aliases = Array.isArray(record.aliases) ? record.aliases : [];
	const aliasSlugs = aliases.flatMap((alias) => {
		if (typeof alias === "string") return [alias];
		const aliasRecord = asRecord(alias);
		const value = aliasRecord
			? firstString(aliasRecord, ["slug", "path", "href", "url"])
			: undefined;
		return value ? [value] : [];
	});
	return [
		...stringArray(record.legacySlugs),
		...stringArray(record.legacy_slugs),
		...aliasSlugs,
	];
}

function hierarchyForSlug(
	slug: string,
): Pick<FlatSpecNavEntry, "domain" | "area" | "feature"> {
	const parts = normalizeSlug(slug).split("/").filter(Boolean);
	const offset = parts[0] === "platform-spec" ? 1 : 0;
	return {
		domain: parts[offset],
		area: parts[offset + 1],
		feature: parts[offset + 2],
	};
}

function entryToNavEntry(value: unknown): FlatSpecNavEntry | null {
	const record = asRecord(value);
	if (!record) return null;

	const stableId = firstString(record, [
		"stableId",
		"stable_id",
		"id",
		"requirementId",
		"capabilityId",
	]);
	const aliases = legacySlugs(record);
	const rawSlug =
		firstString(record, ["slug", "legacySlug", "capabilityPath", "path"]) ??
		aliases[0] ??
		stableId;
	const rawHref = firstString(record, [
		"canonicalUrl",
		"canonical_url",
		"href",
		"url",
	]);
	const title = firstString(record, ["title", "name", "summary"]);
	if (!rawSlug || !title) return null;

	const slug = normalizeSlug(rawSlug);
	const href = rawHref ? rawHref.replace(/^https?:\/\/[^/]+/i, "") : `/${slug}/`;
	const level =
		firstString(record, ["specLevel", "level", "kind", "type"]) ??
		(firstString(record, ["requirementAnchor", "requirement_anchor"])
			? "requirement"
			: "capability");

	const hierarchy = hierarchyForSlug(slug);
	return {
		slug,
		href,
		title,
		level,
		domain: firstString(record, ["domain"]) ?? hierarchy.domain,
		area: firstString(record, ["area"]) ?? hierarchy.area,
		feature: firstString(record, ["feature"]) ?? hierarchy.feature,
		standardId: stableId,
	};
}

function requirementNavEntries(
	value: unknown,
	parent: FlatSpecNavEntry,
): FlatSpecNavEntry[] {
	const record = asRecord(value);
	if (!record || !Array.isArray(record.requirements)) return [];
	return record.requirements.flatMap((requirement) => {
		const item = asRecord(requirement);
		if (!item) return [];
		const standardId = firstString(item, ["stableId", "stable_id", "id"]);
		const title = firstString(item, ["title", "name", "summary"]);
		const anchor =
			firstString(item, ["anchor", "requirementAnchor", "requirement_anchor"]) ??
			standardId;
		if (!title || !anchor) return [];
		return [
			{
				...parent,
				slug: `${parent.slug}#${anchor}`,
				href: `${parent.href.replace(/#.*$/, "")}#${anchor}`,
				title,
				level: "requirement",
				standardId,
			},
		];
	});
}

export function parseOpenSpecCatalogNav(
	raw: unknown,
): OpenSpecCatalogNavResult {
	const root = asRecord(raw);
	if (!root) return { entries: [] };
	const nestedCatalog = asRecord(root.catalog);
	const rows = Array.isArray(root.entries)
		? root.entries
		: Array.isArray(nestedCatalog?.entries)
			? nestedCatalog.entries
			: [];
	const revision = firstString(root, [
		"revision",
		"catalogRevision",
		"catalog_revision",
		"generatedAt",
	]);

	const entries = rows
		.flatMap((row) => {
			const parent = entryToNavEntry(row);
			return parent ? [parent, ...requirementNavEntries(row, parent)] : [];
		})
		.map((entry) => ({ ...entry, catalogRevision: revision }));

	return { revision, entries };
}

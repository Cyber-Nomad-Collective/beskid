export interface PlatformSpecNavNode {
	slug: string;
	href: string;
	title: string;
	level: string;
	children?: PlatformSpecNavNode[];
}

export interface PlatformSpecNavTreeFile {
	generatedAt: string;
	tree: PlatformSpecNavNode;
}

export interface FlatSpecNavEntry {
	slug: string;
	href: string;
	title: string;
	level: string;
	/** Stable OpenSpec catalog identifier, when supplied by the catalog. */
	standardId?: string;
	/** Revision that supplied the stable identifier. */
	catalogRevision?: string;
	domain?: string;
	area?: string;
	feature?: string;
}

export function flattenNavTree(
	node: PlatformSpecNavNode,
	out: FlatSpecNavEntry[] = [],
	ancestors: { domain?: string; area?: string } = {},
): FlatSpecNavEntry[] {
	let nextAncestors = { ...ancestors };

	if (node.slug !== "platform-spec" || node.level !== "root") {
		const entry: FlatSpecNavEntry = {
			slug: node.slug,
			href: node.href,
			title: node.title,
			level: node.level,
			domain: ancestors.domain,
			area: ancestors.area,
		};

		if (node.level === "domain") {
			const id = node.slug.split("/").at(-1);
			nextAncestors = { domain: id };
			entry.domain = id;
		} else if (node.level === "area") {
			const id = node.slug.split("/").at(-1);
			nextAncestors = { ...ancestors, area: id };
			entry.area = id;
		} else if (node.level === "feature") {
			entry.feature = node.slug.split("/").at(-1);
		}

		out.push(entry);
	}

	for (const child of node.children ?? []) {
		flattenNavTree(child, out, nextAncestors);
	}
	return out;
}

export function searchNavEntries(
	entries: FlatSpecNavEntry[],
	query: string,
	limit = 20,
	level?: string,
): FlatSpecNavEntry[] {
	const q = query.trim().toLowerCase();
	let pool = entries;
	if (level) {
		pool = entries.filter((entry) => entry.level === level);
	}
	if (!q) return pool.slice(0, limit);
	return pool
		.filter(
			(entry) =>
				entry.title.toLowerCase().includes(q) ||
				entry.slug.toLowerCase().includes(q),
		)
		.slice(0, limit);
}

export function entryForPath(
	entries: FlatSpecNavEntry[],
	path: string,
): FlatSpecNavEntry | undefined {
	const normalized = path.replace(/\/+$/, "").replace(/^\//, "");
	return entries.find(
		(entry) =>
			entry.href.replace(/\/+$/, "") === `/${normalized}` ||
			entry.slug === normalized,
	);
}

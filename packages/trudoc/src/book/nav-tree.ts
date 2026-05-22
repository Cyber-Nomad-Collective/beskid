export type BookNavTreeNode = {
	slug: string;
	/** Omitted for branch-only folders with no index/README page. */
	href?: string;
	title: string;
	/** Nav part label (Tutorial, Reference, Appendix). */
	part?: string;
	defaultOpen?: boolean;
	children?: BookNavTreeNode[];
};

export type BookNavLink = {
	slug: string;
	href: string;
	title: string;
};

export type BookPrevNext = {
	prev?: BookNavLink;
	next?: BookNavLink;
};

export function slugToHref(slug: string): string {
	return `/${slug}/`;
}

/**
 * Starlight docs slug for a content file (must match built routes).
 * - `index.md` → parent directory slug
 * - other files → path with final segment lowercased (`README.md` → `…/readme`)
 */
export function docFilePathToSlug(absFile: string, docsRoot: string): string {
	const rel = absFile
		.replace(/\\/g, '/')
		.replace(docsRoot.replace(/\\/g, '/').replace(/\/?$/, '/'), '')
		.replace(/^\//, '');
	const baseName = rel.split('/').pop()?.replace(/\.(md|mdx)$/i, '') ?? '';
	let slug = rel.replace(/\.(md|mdx)$/i, '');
	if (/^index$/i.test(baseName)) {
		return slug.replace(/\/index$/i, '');
	}
	const parts = slug.split('/');
	const last = parts[parts.length - 1] ?? '';
	parts[parts.length - 1] = last.toLowerCase();
	return parts.join('/');
}

/**
 * Turn a flat tutorial manifest (e.g. `00-why-beskid-exists`, `00-why-beskid-exists/my-story`)
 * into a nested rail tree: child paths become `children` of the nearest manifest parent prefix.
 */
export function nestTutorialNavNodes(
	entries: string[],
	nodeForEntry: (entry: string) => BookNavTreeNode,
): BookNavTreeNode[] {
	const childEntries = new Set<string>();
	for (const entry of entries) {
		if (entry === 'index') continue;
		for (const other of entries) {
			if (other !== entry && other.startsWith(`${entry}/`)) {
				childEntries.add(other);
			}
		}
	}

	return entries
		.filter((entry) => !childEntries.has(entry))
		.map((entry) => {
			const node = nodeForEntry(entry);
			const childList = entries.filter((e) => e.startsWith(`${entry}/`));
			if (!childList.length) return node;
			return {
				...node,
				children: childList.map((e) => nodeForEntry(e)),
			};
		});
}

export function buildTutorialPrevNext(sequence: BookNavLink[]): Record<string, BookPrevNext> {
	const out: Record<string, BookPrevNext> = {};
	for (let i = 0; i < sequence.length; i++) {
		const cur = sequence[i]!;
		out[cur.slug] = {
			prev: i > 0 ? sequence[i - 1] : undefined,
			next: i < sequence.length - 1 ? sequence[i + 1] : undefined,
		};
	}
	return out;
}

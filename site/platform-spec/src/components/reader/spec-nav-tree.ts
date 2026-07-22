import type { OpenSpecNavNode } from "#/lib/spec/domain-model";

export interface TitleRange {
	start: number;
	end: number;
	match: boolean;
}

function normalize(value: string): string {
	return value.trim().toLocaleLowerCase();
}

export function filterNavTree(
	tree: OpenSpecNavNode,
	query: string,
): OpenSpecNavNode | null {
	const normalizedQuery = normalize(query);
	if (!normalizedQuery) return tree;

	function visit(node: OpenSpecNavNode): OpenSpecNavNode | null {
		const children = node.children?.flatMap((child) => {
			const filtered = visit(child);
			return filtered ? [filtered] : [];
		});
		const titleMatches = normalize(node.title).includes(normalizedQuery);
		if (!titleMatches && (!children || children.length === 0)) return null;
		return children ? { ...node, children } : { ...node };
	}

	return visit(tree);
}

export function findActivePath(
	tree: OpenSpecNavNode,
	activeSlug?: string,
): string[] {
	if (!activeSlug) return [];
	function visit(node: OpenSpecNavNode, path: string[]): string[] | null {
		const nextPath = [...path, node.slug];
		if (node.slug === activeSlug) return nextPath;
		for (const child of node.children ?? []) {
			const matched = visit(child, nextPath);
			if (matched) return matched;
		}
		return null;
	}
	return visit(tree, []) ?? [];
}

export function highlightTitle(title: string, query: string): TitleRange[] {
	const normalizedQuery = normalize(query);
	if (!normalizedQuery) return [{ start: 0, end: title.length, match: false }];
	const searchableTitle = title.toLocaleLowerCase();
	const ranges: TitleRange[] = [];
	let cursor = 0;
	let index = searchableTitle.indexOf(normalizedQuery, cursor);
	while (index !== -1) {
		if (index > cursor) ranges.push({ start: cursor, end: index, match: false });
		const end = index + normalizedQuery.length;
		ranges.push({ start: index, end, match: true });
		cursor = end;
		index = searchableTitle.indexOf(normalizedQuery, cursor);
	}
	if (cursor < title.length) ranges.push({ start: cursor, end: title.length, match: false });
	return ranges;
}

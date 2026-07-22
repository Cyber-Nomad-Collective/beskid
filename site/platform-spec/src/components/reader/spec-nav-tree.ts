import type { OpenSpecNavNode } from "#/lib/spec/domain-model";

export interface TitleRange {
	start: number;
	end: number;
	match: boolean;
}

function normalize(value: string, locale?: string | string[]): string {
	return value.trim().toLocaleLowerCase(locale);
}

export interface NavSearchResult {
	tree: OpenSpecNavNode | null;
	matchingSlugs: Set<string>;
	expandedSlugs: Set<string>;
	matchCount: number;
}

export type TreeNavigationKey =
	| "ArrowDown"
	| "ArrowUp"
	| "ArrowLeft"
	| "ArrowRight"
	| "Home"
	| "End"
	| "Enter";

export type TreeKeyDecision =
	| { focusSlug: string }
	| { expandSlug: string }
	| { collapseSlug: string }
	| { activate: true }
	| null;

export function resolveTrappedFocusIndex(
	currentIndex: number,
	itemCount: number,
	shiftKey: boolean,
): number | null {
	if (itemCount <= 0) return null;
	if (currentIndex < 0) return shiftKey ? itemCount - 1 : 0;
	if (shiftKey && currentIndex <= 0) return itemCount - 1;
	if (!shiftKey && currentIndex >= itemCount - 1) return 0;
	return null;
}

export function createNavSearchResult(
	tree: OpenSpecNavNode,
	query: string,
): NavSearchResult {
	const normalizedQuery = normalize(query);
	if (!normalizedQuery) {
		return {
			tree,
			matchingSlugs: new Set(),
			expandedSlugs: new Set(),
			matchCount: 0,
		};
	}

	const matchingSlugs = new Set<string>();
	const expandedSlugs = new Set<string>();
	function visit(
		node: OpenSpecNavNode,
		ancestors: string[],
	): OpenSpecNavNode | null {
		const titleMatches = normalize(node.title).includes(normalizedQuery);
		if (titleMatches) {
			matchingSlugs.add(node.slug);
			ancestors.forEach((slug) => expandedSlugs.add(slug));
		}
		const children = node.children?.flatMap((child) => {
			const filtered = visit(child, [...ancestors, node.slug]);
			return filtered ? [filtered] : [];
		});
		if (!titleMatches && (!children || children.length === 0)) return null;
		return children ? { ...node, children } : { ...node };
	}

	const children = tree.children?.flatMap((child) => {
		const filtered = visit(child, [tree.slug]);
		return filtered ? [filtered] : [];
	});
	return {
		tree: children?.length ? { ...tree, children } : null,
		matchingSlugs,
		expandedSlugs,
		matchCount: matchingSlugs.size,
	};
}

export function filterNavTree(
	tree: OpenSpecNavNode,
	query: string,
): OpenSpecNavNode | null {
	return createNavSearchResult(tree, query).tree;
}

function visibleNodes(
	tree: OpenSpecNavNode,
	expanded: ReadonlySet<string>,
): Array<{ node: OpenSpecNavNode; parentSlug?: string }> {
	const visible: Array<{ node: OpenSpecNavNode; parentSlug?: string }> = [];
	function visit(node: OpenSpecNavNode, parentSlug?: string) {
		visible.push({ node, parentSlug });
		if (expanded.has(node.slug)) {
			node.children?.forEach((child) => visit(child, node.slug));
		}
	}
	tree.children?.forEach((child) => visit(child));
	return visible;
}

export function getVisibleTreeSlugs(
	tree: OpenSpecNavNode,
	expanded: ReadonlySet<string>,
): string[] {
	return visibleNodes(tree, expanded).map(({ node }) => node.slug);
}

export function resolveTreeKey(
	tree: OpenSpecNavNode,
	expanded: ReadonlySet<string>,
	currentSlug: string,
	key: TreeNavigationKey,
): TreeKeyDecision {
	const visible = visibleNodes(tree, expanded);
	const index = visible.findIndex(({ node }) => node.slug === currentSlug);
	if (index === -1) return null;
	const current = visible[index];
	if (!current) return null;

	switch (key) {
		case "ArrowDown":
			return { focusSlug: visible[Math.min(index + 1, visible.length - 1)]!.node.slug };
		case "ArrowUp":
			return { focusSlug: visible[Math.max(index - 1, 0)]!.node.slug };
		case "Home":
			return { focusSlug: visible[0]!.node.slug };
		case "End":
			return { focusSlug: visible.at(-1)!.node.slug };
		case "ArrowRight":
			if (!current.node.children?.length) return null;
			return expanded.has(currentSlug)
				? { focusSlug: current.node.children[0]!.slug }
				: { expandSlug: currentSlug };
		case "ArrowLeft":
			if (current.node.children?.length && expanded.has(currentSlug)) {
				return { collapseSlug: currentSlug };
			}
			return current.parentSlug ? { focusSlug: current.parentSlug } : null;
		case "Enter":
			return { activate: true };
	}
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

export function highlightTitle(
	title: string,
	query: string,
	locale?: string | string[],
): TitleRange[] {
	const normalizedQuery = normalize(query, locale);
	if (!normalizedQuery) return [{ start: 0, end: title.length, match: false }];
	const searchableTitle = title.toLocaleLowerCase(locale);
	const foldedOffsets: Array<{ start: number; end: number }> = [];
	let titleOffset = 0;
	let foldedOffset = 0;
	let previousCharacter: { start: number; end: number } | undefined;
	for (const character of title) {
		const end = titleOffset + character.length;
		const currentCharacter = { start: titleOffset, end };
		const characterFold = character.toLocaleLowerCase(locale);
		const nextFoldedOffset = characterFold
			? searchableTitle.indexOf(characterFold, foldedOffset)
			: foldedOffset;
		const characterFoldStart = nextFoldedOffset === -1 ? foldedOffset : nextFoldedOffset;
		const contextualCharacter = previousCharacter ?? currentCharacter;
		while (foldedOffset < characterFoldStart) {
			foldedOffsets.push(contextualCharacter);
			foldedOffset += 1;
		}
		for (
			let index = 0;
			index < characterFold.length && foldedOffset < searchableTitle.length;
			index += 1
		) {
			foldedOffsets.push({ start: titleOffset, end });
			foldedOffset += 1;
		}
		titleOffset = end;
		previousCharacter = currentCharacter;
	}
	while (foldedOffset < searchableTitle.length && previousCharacter) {
		foldedOffsets.push(previousCharacter);
		foldedOffset += 1;
	}
	const ranges: TitleRange[] = [];
	let cursor = 0;
	let index = searchableTitle.indexOf(normalizedQuery, cursor);
	while (index !== -1) {
		const start = foldedOffsets[index]?.start ?? title.length;
		const end = index + normalizedQuery.length;
		const matchEnd = foldedOffsets[end - 1]?.end ?? title.length;
		const previousEnd = ranges.at(-1)?.end ?? 0;
		if (start > previousEnd) {
			ranges.push({ start: previousEnd, end: start, match: false });
		}
		ranges.push({ start, end: matchEnd, match: true });
		cursor = end;
		index = searchableTitle.indexOf(normalizedQuery, cursor);
	}
	const finalEnd = ranges.at(-1)?.end ?? 0;
	if (finalEnd < title.length) {
		ranges.push({ start: finalEnd, end: title.length, match: false });
	}
	return ranges;
}

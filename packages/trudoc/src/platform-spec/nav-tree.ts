import type { LayoutLevel } from '../layout/schema';
import type { PathClass } from '../layout/scan';

export type NavTreeLevel = LayoutLevel;

export type NavTreeNode = {
	slug: string;
	href: string;
	title: string;
	level: NavTreeLevel;
	children?: NavTreeNode[];
};

export type NavTreeDocRow = {
	slug: string;
	title: string;
	level: NavTreeLevel;
	href: string;
};

/** Domains shown in Starlight sidebar but omitted from hierarchy nav (meta / mapping). */
export const SKIP_NAV_DOMAINS = new Set(['legacy-spec-mapping']);

export function slugToHref(slug: string): string {
	return `/${slug}/`;
}

export function pathClassToNavLevel(cls: PathClass): NavTreeLevel | null {
	switch (cls) {
		case 'domain-root':
			return 'root';
		case 'domain':
			return 'domain';
		case 'area':
			return 'area';
		case 'feature':
			return 'feature';
		case 'article':
			return 'article';
		default:
			return null;
	}
}

function parentSlugFor(slug: string, level: NavTreeLevel): string {
	const parts = slug.split('/').filter(Boolean);
	if (level === 'domain') return 'platform-spec';
	if (level === 'area') return parts.slice(0, 2).join('/');
	if (level === 'feature') return parts.slice(0, 3).join('/');
	if (level === 'article') return parts.slice(0, -1).join('/');
	return 'platform-spec';
}

function sortChildrenRecursive(node: NavTreeNode): void {
	if (!node.children?.length) return;
	node.children.sort((a, b) => a.title.localeCompare(b.title));
	for (const child of node.children) sortChildrenRecursive(child);
}

/**
 * Nest flat doc rows into a single root (`platform-spec`) matching domain → area → feature → article.
 */
export function buildNavTree(rows: NavTreeDocRow[]): NavTreeNode {
	const sorted = [...rows].sort((a, b) => a.slug.localeCompare(b.slug));

	const rootRow = sorted.find((r) => r.slug === 'platform-spec');
	const root: NavTreeNode = {
		slug: 'platform-spec',
		href: '/platform-spec/',
		title: rootRow?.title ?? 'Platform specification',
		level: 'root',
		children: [],
	};

	const bySlug = new Map<string, NavTreeNode>([['platform-spec', root]]);

	for (const row of sorted) {
		if (row.slug === 'platform-spec') {
			root.title = row.title;
			continue;
		}

		const node: NavTreeNode = {
			slug: row.slug,
			href: row.href,
			title: row.title,
			level: row.level,
			children: row.level === 'article' ? undefined : [],
		};
		bySlug.set(row.slug, node);

		const parentSlug = parentSlugFor(row.slug, row.level);
		const parent = bySlug.get(parentSlug);
		if (parent?.children) {
			parent.children.push(node);
		}
	}

	sortChildrenRecursive(root);
	return root;
}

export function shouldSkipPlatformSpecRel(relUnderSpec: string): boolean {
	const domain = relUnderSpec.split('/').filter(Boolean)[0];
	return domain != null && SKIP_NAV_DOMAINS.has(domain);
}

import type { CollectionEntry } from 'astro:content';
import { SKIP_NAV_DOMAINS } from 'trudoc/platform-spec';
import type { GitCommitRow, GitFileMeta, NavTreeNode, PlatformSpecGitMeta } from 'trudoc/platform-spec';
import { docEntryHref, normalizeDocSlug } from './specSlug';

export type DomainNavCounts = {
	areas: number;
	features: number;
	articles: number;
};

export type DomainStandingCounts = {
	standard: number;
	proposed: number;
};

export type DomainTileStats = DomainNavCounts & DomainStandingCounts;

export type PlatformSpecSearchItem = {
	title: string;
	href: string;
	level: string;
	subtitle: string;
};

export type LatestSpecChange = GitCommitRow & {
	href: string | null;
	pageTitle: string;
};

function countSubtree(node: NavTreeNode): DomainNavCounts {
	let areas = 0;
	let features = 0;
	let articles = 0;
	for (const child of node.children ?? []) {
		if (child.level === 'area') areas += 1;
		if (child.level === 'feature') features += 1;
		if (child.level === 'article') articles += 1;
		const nested = countSubtree(child);
		areas += nested.areas;
		features += nested.features;
		articles += nested.articles;
	}
	return { areas, features, articles };
}

/** Nav-tree counts per domain slug (`platform-spec/compiler`, …). */
export function domainStatsFromNavTree(tree: NavTreeNode): Map<string, DomainNavCounts> {
	const out = new Map<string, DomainNavCounts>();
	for (const child of tree.children ?? []) {
		if (child.level !== 'domain' || SKIP_NAV_DOMAINS.has(child.slug.split('/')[1] ?? '')) continue;
		out.set(child.slug, countSubtree(child));
	}
	return out;
}

export function standingCountsForDomain(
	docs: CollectionEntry<'docs'>[],
	domainSlug: string,
	slugOf: (e: CollectionEntry<'docs'>) => string,
): DomainStandingCounts {
	let standard = 0;
	let proposed = 0;
	const prefix = `${domainSlug}/`;
	for (const e of docs) {
		const s = slugOf(e);
		if (s !== domainSlug && !s.startsWith(prefix)) continue;
		const status = (e.data as { status?: string }).status;
		if (status === 'Standard') standard += 1;
		else if (status === 'Proposed') proposed += 1;
	}
	return { standard, proposed };
}

export function mergeDomainTileStats(
	nav: DomainNavCounts | undefined,
	standing: DomainStandingCounts,
): DomainTileStats {
	return {
		areas: nav?.areas ?? 0,
		features: nav?.features ?? 0,
		articles: nav?.articles ?? 0,
		standard: standing.standard,
		proposed: standing.proposed,
	};
}

export function domainTileBadges(stats: DomainTileStats): { label: string; variant: 'neutral' | 'accent' | 'muted' }[] {
	const badges: { label: string; variant: 'neutral' | 'accent' | 'muted' }[] = [];
	if (stats.areas > 0) {
		badges.push({
			label: `${stats.areas} area${stats.areas === 1 ? '' : 's'}`,
			variant: 'neutral',
		});
	}
	if (stats.features > 0) {
		badges.push({
			label: `${stats.features} feature${stats.features === 1 ? '' : 's'}`,
			variant: 'neutral',
		});
	}
	if (stats.standard > 0) {
		badges.push({
			label: `${stats.standard} Standard`,
			variant: 'accent',
		});
	}
	if (stats.proposed > 0) {
		badges.push({
			label: `${stats.proposed} Proposed`,
			variant: 'muted',
		});
	}
	if (stats.articles > 0 && badges.length < 4) {
		badges.push({
			label: `${stats.articles} article${stats.articles === 1 ? '' : 's'}`,
			variant: 'muted',
		});
	}
	return badges.slice(0, 4);
}

function flattenNavForSearch(node: NavTreeNode, trail: string[]): PlatformSpecSearchItem[] {
	const title = node.title;
	const nextTrail = node.level === 'root' ? trail : [...trail, title];
	const items: PlatformSpecSearchItem[] = [];
	if (node.level !== 'root') {
		items.push({
			title,
			href: node.href,
			level: node.level,
			subtitle: nextTrail.slice(0, -1).join(' › ') || 'Platform specification',
		});
	}
	for (const child of node.children ?? []) {
		if (child.level === 'domain') {
			const domainKey = child.slug.split('/')[1] ?? '';
			if (SKIP_NAV_DOMAINS.has(domainKey)) continue;
		}
		items.push(...flattenNavForSearch(child, nextTrail));
	}
	return items;
}

export function buildPlatformSpecSearchIndex(tree: NavTreeNode): PlatformSpecSearchItem[] {
	return flattenNavForSearch(tree, []).sort((a, b) => a.title.localeCompare(b.title));
}

export function websitePathToDocHref(websitePath: string): string | null {
	if (!websitePath.startsWith('src/content/docs/')) return null;
	const slug = normalizeDocSlug(websitePath.replace(/^src\/content\/docs\//, ''));
	return docEntryHref(slug);
}

export function collectLatestSpecChanges(
	meta: PlatformSpecGitMeta,
	docTitleByPath: Map<string, string>,
	limit = 8,
): LatestSpecChange[] {
	const seen = new Set<string>();
	const rows: LatestSpecChange[] = [];
	for (const [websitePath, file] of Object.entries(meta.files ?? {})) {
		const entry = file as GitFileMeta;
		const pageTitle = docTitleByPath.get(websitePath) ?? entry.repoRelativePath;
		for (const commit of entry.commits) {
			if (seen.has(commit.hash)) continue;
			seen.add(commit.hash);
			rows.push({
				...commit,
				href: websitePathToDocHref(websitePath),
				pageTitle,
			});
		}
	}
	rows.sort((a, b) => b.date.localeCompare(a.date));
	return rows.slice(0, limit);
}

/** Website-relative content paths (`src/content/docs/...`) → page title. */
export function docTitlesByWebsitePath(
	docs: CollectionEntry<'docs'>[],
	websitePathOf: (slug: string) => string,
	slugOf: (e: CollectionEntry<'docs'>) => string,
): Map<string, string> {
	const map = new Map<string, string>();
	for (const e of docs) {
		const slug = slugOf(e);
		if (!slug.startsWith('platform-spec')) continue;
		const title = String((e.data as { title?: string }).title ?? slug);
		map.set(websitePathOf(slug), title);
	}
	return map;
}

export function countNavTreeTotals(tree: NavTreeNode): {
	domains: number;
	areas: number;
	features: number;
} {
	let domains = 0;
	let areas = 0;
	let features = 0;
	for (const domain of tree.children ?? []) {
		if (domain.level !== 'domain' || SKIP_NAV_DOMAINS.has(domain.slug.split('/')[1] ?? '')) continue;
		domains += 1;
		const c = countSubtree(domain);
		areas += c.areas;
		features += c.features;
	}
	return { domains, areas, features };
}

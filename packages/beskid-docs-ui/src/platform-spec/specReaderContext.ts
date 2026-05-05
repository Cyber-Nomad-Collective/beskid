import type { CollectionEntry } from 'astro:content';
import fs from 'node:fs/promises';
import pathModule from 'node:path';
import type { RelatedTopicPayload } from 'trudoc/platform-spec';
import { docEntryHref, docEntrySlug, normalizedPathname } from './specSlug';
import { websiteRelativeDocPath } from './specDocPath';
export type SpecArticleListItem = {
	title: string;
	description?: string;
	status?: string;
	lastReviewed?: string;
	kind: string;
	href: string;
};

type DocsEntry = CollectionEntry<'docs'>;

export type SpecReaderComputed = {
	path: string;
	currentDoc: DocsEntry | undefined;
	relatedTopics: RelatedTopicPayload[];
	currentSpecLevel: string | undefined;
	currentSlug: string;
	articleRootSlug: string;
	currentDepth: number;
	articleEntries: SpecArticleListItem[];
	hasDescendantArticles: boolean;
	architectureGraph: unknown;
	historyWebsiteRelativePath: string | null;
	nodeKey: string;
};

export async function computeSpecReaderState(pathname: string, docs: DocsEntry[], cwd: string): Promise<SpecReaderComputed> {
	const path = normalizedPathname(pathname);
	const currentDoc = docs.find((entry) => docEntrySlug(entry) === path);
	const relatedTopics: RelatedTopicPayload[] = Array.isArray(currentDoc?.data?.relatedTopics)
		? (currentDoc?.data?.relatedTopics as RelatedTopicPayload[])
		: [];
	const currentSpecLevel = typeof currentDoc?.data?.specLevel === 'string' ? currentDoc.data.specLevel : undefined;
	const currentSlug = currentDoc ? docEntrySlug(currentDoc) : path;
	const articleRootSlug =
		currentSpecLevel === 'article' ? currentSlug.split('/').slice(0, -1).join('/') : currentSlug;
	const currentDepth = articleRootSlug.split('/').filter(Boolean).length;
	const articleEntries =
		currentDoc && articleRootSlug
			? docs
					.filter((entry) => {
						const slug = docEntrySlug(entry);
						if ((entry.data as { specLevel?: string }).specLevel !== 'article') return false;
						if (!slug.startsWith(`${articleRootSlug}/`)) return false;
						if (slug === articleRootSlug) return false;
						const parentSlug = slug.split('/').slice(0, -1).join('/');
						return parentSlug === articleRootSlug;
					})
					.sort((a, b) => docEntrySlug(a).localeCompare(docEntrySlug(b)))
					.map((entry) => ({
						title: String(entry.data.title ?? docEntrySlug(entry).split('/').at(-1) ?? 'Untitled'),
						description:
							typeof entry.data.description === 'string' && entry.data.description.trim().length
								? entry.data.description.trim()
								: undefined,
						status: typeof entry.data.status === 'string' ? entry.data.status : undefined,
						lastReviewed:
							typeof entry.data.lastReviewed === 'string' || entry.data.lastReviewed instanceof Date
								? String(entry.data.lastReviewed).slice(0, 10)
								: undefined,
						kind: typeof entry.data.specLevel === 'string' ? entry.data.specLevel : 'article',
						href: docEntryHref(docEntrySlug(entry)),
					}))
			: [];
	const hasDescendantArticles =
		currentDoc && articleRootSlug
			? docs.some((entry) => {
					const slug = docEntrySlug(entry);
					return (
						(entry.data as { specLevel?: string }).specLevel === 'article' &&
						slug.startsWith(`${articleRootSlug}/`) &&
						slug.split('/').filter(Boolean).length > currentDepth + 1
					);
				})
			: false;

	let architectureGraph: unknown = undefined;
	const archMeta = currentDoc?.data?.architectureGraph as { source?: string } | undefined;
	if (archMeta?.source) {
		const source = archMeta.source.replace(/^\//, '');
		const absolute = pathModule.resolve(cwd, source);
		try {
			const raw = await fs.readFile(absolute, 'utf8');
			architectureGraph = JSON.parse(raw);
		} catch {
			architectureGraph = undefined;
		}
	}

	const historyWebsiteRelativePath = websiteRelativeDocPath(cwd, path);

	let nodeKey = '';
	if (path === 'platform-spec') {
		nodeKey = 'beskid';
	} else if (path.startsWith('platform-spec/')) {
		const rest = path.slice('platform-spec/'.length);
		const segs = rest.split('/').filter(Boolean);
		if (segs.length === 1) nodeKey = `domain:${segs[0]}`;
		else if (segs.length === 2) nodeKey = `area:${segs[0]}/${segs[1]}`;
		else nodeKey = `feat:platform-spec/${rest}`;
	}

	return {
		path,
		currentDoc,
		relatedTopics,
		currentSpecLevel,
		currentSlug,
		articleRootSlug,
		currentDepth,
		articleEntries,
		hasDescendantArticles,
		architectureGraph,
		historyWebsiteRelativePath,
		nodeKey,
	};
}

/** Architecture graph from a specific collection entry (e.g. parent feature hub). */
export async function loadArchitectureGraphForEntry(entry: DocsEntry | undefined, cwd: string): Promise<unknown> {
	if (!entry) return undefined;
	const archMeta = entry.data?.architectureGraph as { source?: string } | undefined;
	if (!archMeta?.source) return undefined;
	const source = archMeta.source.replace(/^\//, '');
	const absolute = pathModule.resolve(cwd, source);
	try {
		const raw = await fs.readFile(absolute, 'utf8');
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

import type { CollectionEntry } from 'astro:content';
import fs from 'node:fs/promises';
import pathModule from 'node:path';
import type { RelatedTopicPayload } from 'trudoc/platform-spec';
import { parseAdrSections, type AdrSectionKey } from './parseAdrSections';
import { renderAdrSectionMarkdown } from './renderAdrMarkdown';
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

export type SpecAdrSectionContent = {
	html: string;
};

export type SpecAdrListItem = {
	title: string;
	description?: string;
	adrId: string;
	adrStatus: string;
	adrDate?: string;
	status?: string;
	href: string;
	sections: Partial<Record<AdrSectionKey, SpecAdrSectionContent>>;
};

type DocsEntry = CollectionEntry<'docs'>;

/** Feature hub slug for reader tabs (articles, ADRs, history) on hub, article, and ADR pages. */
function resolveArticleRootSlug(currentSlug: string, specLevel: string | undefined): string {
	if (specLevel === 'article') {
		return currentSlug.split('/').slice(0, -1).join('/');
	}
	if (specLevel === 'adr') {
		const parts = currentSlug.split('/');
		const adrIndex = parts.lastIndexOf('adr');
		if (adrIndex > 0) return parts.slice(0, adrIndex).join('/');
	}
	return currentSlug;
}

async function readDocSource(cwd: string, slug: string): Promise<string | null> {
	const base = pathModule.join(cwd, 'src', 'content', 'docs', slug);
	for (const ext of ['.mdx', '.md']) {
		const filePath = `${base}${ext}`;
		try {
			return await fs.readFile(filePath, 'utf8');
		} catch {
			/* try next extension */
		}
	}
	return null;
}

export type SpecReaderComputed = {
	path: string;
	currentDoc: DocsEntry | undefined;
	relatedTopics: RelatedTopicPayload[];
	currentSpecLevel: string | undefined;
	currentSlug: string;
	articleRootSlug: string;
	currentDepth: number;
	articleEntries: SpecArticleListItem[];
	adrEntries: SpecAdrListItem[];
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
	const articleRootSlug = resolveArticleRootSlug(currentSlug, currentSpecLevel);
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

	const adrCandidates =
		currentDoc && articleRootSlug
			? docs
					.filter((entry) => {
						const slug = docEntrySlug(entry);
						if ((entry.data as { specLevel?: string }).specLevel !== 'adr') return false;
						return slug.startsWith(`${articleRootSlug}/adr/`);
					})
					.sort((a, b) => {
						const aId = String((a.data as { adrId?: string }).adrId ?? docEntrySlug(a));
						const bId = String((b.data as { adrId?: string }).adrId ?? docEntrySlug(b));
						return aId.localeCompare(bId);
					})
			: [];

	const adrEntries: SpecAdrListItem[] = [];
	for (const entry of adrCandidates) {
		const slug = docEntrySlug(entry);
		const data = entry.data as {
			title?: string;
			description?: string;
			status?: string;
			adrId?: string;
			adrStatus?: string;
			adrDate?: string | Date;
		};
		const raw = await readDocSource(cwd, slug);
		const parsedSections = raw ? parseAdrSections(raw) : {};
		const sections: Partial<Record<AdrSectionKey, SpecAdrSectionContent>> = {};
		for (const [key, markdown] of Object.entries(parsedSections) as [AdrSectionKey, string][]) {
			if (!markdown?.trim()) continue;
			sections[key] = { html: await renderAdrSectionMarkdown(markdown) };
		}
		adrEntries.push({
			title: String(data.title ?? slug.split('/').at(-1) ?? 'Untitled'),
			description:
				typeof data.description === 'string' && data.description.trim().length
					? data.description.trim()
					: undefined,
			adrId: String(data.adrId ?? slug.split('/').at(-1) ?? 'ADR'),
			adrStatus: String(data.adrStatus ?? 'Accepted'),
			adrDate:
				typeof data.adrDate === 'string' || data.adrDate instanceof Date
					? String(data.adrDate).slice(0, 10)
					: undefined,
			status: typeof data.status === 'string' ? data.status : undefined,
			href: docEntryHref(slug),
			sections,
		});
	}
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
		adrEntries,
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

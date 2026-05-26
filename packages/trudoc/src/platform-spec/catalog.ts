import type { PathClass } from '../layout/scan';

/** Flat catalog row emitted by `generate-platform-spec-catalog.mjs`. */
export type PlatformSpecCatalogEntry = {
	slug: string;
	href: string;
	pathClass: PathClass;
	specLevel: string | null;
	title: string;
	description: string | null;
	status: string | null;
	adrId: string | null;
	adrStatus: string | null;
	repoPath: string;
	contentPath: string;
	parentSlug: string | null;
	hasLayoutJson: boolean;
};

export type PlatformSpecCatalogFile = {
	generatedAt: string;
	entries: PlatformSpecCatalogEntry[];
};

/** Per-document bundle for tracker edit baseline. */
export type PlatformSpecDocumentBundle = {
	generatedAt: string;
	slug: string;
	repoPath: string;
	frontmatter: Record<string, unknown>;
	body: string;
	layoutJson: Record<string, unknown> | null;
};

export const PLATFORM_SPEC_CATALOG_PATH = '/generated/platform-spec-catalog.json';
export const PLATFORM_SPEC_DOCS_PREFIX = '/generated/platform-spec-docs/';

export function encodeCatalogDocSlug(slug: string): string {
	return slug.replace(/\//g, '--');
}

export function decodeCatalogDocSlug(encoded: string): string {
	return encoded.replace(/--/g, '/');
}

export function catalogDocContentPath(slug: string): string {
	return `${PLATFORM_SPEC_DOCS_PREFIX}${encodeCatalogDocSlug(slug)}.json`;
}

export function catalogDocUrl(origin: string, slug: string): string {
	const base = origin.replace(/\/$/, '');
	return `${base}${catalogDocContentPath(slug)}`;
}

export function parseCatalogFile(raw: unknown): PlatformSpecCatalogFile {
	if (!raw || typeof raw !== 'object') {
		throw new Error('Invalid platform-spec catalog: expected object');
	}
	const o = raw as Record<string, unknown>;
	if (typeof o.generatedAt !== 'string' || !Array.isArray(o.entries)) {
		throw new Error('Invalid platform-spec catalog: missing generatedAt or entries');
	}
	return o as PlatformSpecCatalogFile;
}

export function parseDocumentBundle(raw: unknown): PlatformSpecDocumentBundle {
	if (!raw || typeof raw !== 'object') {
		throw new Error('Invalid platform-spec document bundle');
	}
	const o = raw as Record<string, unknown>;
	if (typeof o.slug !== 'string' || typeof o.repoPath !== 'string') {
		throw new Error('Invalid platform-spec document bundle: missing slug or repoPath');
	}
	return {
		generatedAt: typeof o.generatedAt === 'string' ? o.generatedAt : '',
		slug: o.slug,
		repoPath: o.repoPath,
		frontmatter:
			o.frontmatter && typeof o.frontmatter === 'object'
				? (o.frontmatter as Record<string, unknown>)
				: {},
		body: typeof o.body === 'string' ? o.body : '',
		layoutJson:
			o.layoutJson && typeof o.layoutJson === 'object'
				? (o.layoutJson as Record<string, unknown>)
				: null,
	};
}

export function parentSlugForCatalog(slug: string, pathClass: PathClass): string | null {
	const parts = slug.split('/').filter(Boolean);
	if (pathClass === 'domain-root') return null;
	if (pathClass === 'domain') return 'platform-spec';
	if (pathClass === 'area') return parts.slice(0, 2).join('/');
	if (pathClass === 'feature') return parts.slice(0, 3).join('/');
	if (pathClass === 'adr') return parts.slice(0, -2).join('/');
	if (pathClass === 'article') return parts.slice(0, -1).join('/');
	return null;
}

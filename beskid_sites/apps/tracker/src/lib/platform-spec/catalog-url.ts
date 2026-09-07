import { beskidDocsUrl } from "#/lib/beskid-docs-origin";

export const PLATFORM_SPEC_CATALOG_PATH = "/api/v1/catalog";
export const OPEN_SPEC_CATALOG_PATH = "/openspec/catalog.json";
export const PLATFORM_SPEC_DOCS_PREFIX = "/api/v1/docs/";

export function platformSpecCatalogUrl(): string {
	return beskidDocsUrl(PLATFORM_SPEC_CATALOG_PATH);
}

export function openSpecCatalogUrl(): string {
	return beskidDocsUrl(OPEN_SPEC_CATALOG_PATH);
}

export function platformSpecDocBundleUrl(slug: string): string {
	return beskidDocsUrl(
		`${PLATFORM_SPEC_DOCS_PREFIX}${encodeURIComponent(slug)}`,
	);
}

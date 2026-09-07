/** Canonical platform-spec origin (Memgraph app). Book remains on beskid-lang.org. */
export const BESKID_DOCS_ORIGIN = "https://spec.beskid-lang.org";
export const PLATFORM_SPEC_ORIGIN = BESKID_DOCS_ORIGIN;

export function beskidDocsUrl(path: string): string {
	const base = BESKID_DOCS_ORIGIN.replace(/\/+$/, "");
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${base}${normalized}`;
}

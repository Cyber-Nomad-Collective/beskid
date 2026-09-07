import { beskidDocsUrl } from "#/lib/beskid-docs-origin";

/** Path on beskid-lang.org for the platform-spec nav tree JSON API. */
export const PLATFORM_SPEC_NAV_TREE_PATH =
	"/generated/platform-spec-nav-tree.json";

export function platformSpecNavTreeUrl(): string {
	return beskidDocsUrl(PLATFORM_SPEC_NAV_TREE_PATH);
}

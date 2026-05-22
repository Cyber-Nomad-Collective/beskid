export type TrudocHtmlDataAttrsOptions = {
	/** Subdirectory under the build output (e.g. `platform-spec`). */
	htmlSubdir: string;
	/** Attribute injected on `<html>` for all pages under `htmlSubdir` (e.g. `data-platform-spec`). */
	docAttr: string;
	/** Optional: built HTML path relative to output root for the “map” index page. */
	mapIndexHtmlRel?: string;
	/** Optional: second attribute for the map index (e.g. `data-platform-spec-map`). */
	mapAttr?: string;
};

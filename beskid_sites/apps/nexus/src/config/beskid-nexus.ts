/** Beskid Nexus product defaults (compiler graph + hosted MCP). */
export const BESKID_NEXUS = {
	/** Optional deep-link slug (`?project=`). Empty = catalog home first. */
	defaultRepo:
		(import.meta.env.VITE_NEXUS_DEFAULT_REPO as string | undefined)?.trim() || "",
	/** Same-origin API (`gitnexus serve` hosts `/api` and the static UI). */
	apiOrigin: typeof window !== "undefined" ? window.location.origin : "",
} as const;

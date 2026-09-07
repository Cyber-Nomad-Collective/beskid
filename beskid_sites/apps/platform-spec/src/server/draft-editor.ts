import { createServerFn } from "@tanstack/react-start";

import { loadOpenSpecCatalog } from "#/server/openspec/reader";

// Draft editor routes run loaders in the client environment, so the
// server-only OpenSpec reader must be reached through an RPC bridge.
export const loadDraftEditorCatalogFn = createServerFn({
	method: "GET",
}).handler(async () => {
	const catalog = loadOpenSpecCatalog();
	return { currentCatalogRevision: catalog.revision };
});

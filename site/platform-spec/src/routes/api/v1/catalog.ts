import { createFileRoute } from "@tanstack/react-router";

import { loadOpenSpecCatalog } from "#/server/openspec/reader";

export const Route = createFileRoute("/api/v1/catalog")({
	server: {
		handlers: {
			GET: async () => Response.json(loadOpenSpecCatalog()),
		},
	},
});

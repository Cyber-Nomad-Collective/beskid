import { createFileRoute } from "@tanstack/react-router";

import { listCatalog } from "#/server/memgraph/documents";

export const Route = createFileRoute("/api/v1/catalog")({
	server: {
		handlers: {
			GET: async () => Response.json(await listCatalog()),
		},
	},
});

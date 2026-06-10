import { createFileRoute } from "@tanstack/react-router";

import { getNavTree } from "#/server/memgraph/documents";

export const Route = createFileRoute("/api/v1/nav-tree")({
	server: {
		handlers: {
			GET: async () => Response.json(await getNavTree()),
		},
	},
});

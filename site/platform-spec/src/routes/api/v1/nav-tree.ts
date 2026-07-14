import { createFileRoute } from "@tanstack/react-router";

import { getOpenSpecNavTree } from "#/server/openspec/reader";

export const Route = createFileRoute("/api/v1/nav-tree")({
	server: {
		handlers: {
			GET: async () => Response.json(getOpenSpecNavTree()),
		},
	},
});

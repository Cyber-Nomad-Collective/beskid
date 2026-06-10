import { createFileRoute } from "@tanstack/react-router";

import { pingMemgraph } from "#/server/memgraph/client";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				const memgraph = await pingMemgraph();
				const ok = memgraph;
				return Response.json(
					{
						ok,
						service: "beskid-platform-spec",
						checks: {
							memgraph,
						},
					},
					{ status: ok ? 200 : 503 },
				);
			},
		},
	},
});

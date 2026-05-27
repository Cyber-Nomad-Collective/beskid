import { createFileRoute } from "@tanstack/react-router";

import { listEnabledApps } from "#/server/config-store";

export const Route = createFileRoute("/api/v1/apps")({
	server: {
		handlers: {
			GET: async () => {
				const apps = await listEnabledApps();
				return Response.json({ apps });
			},
		},
	},
});

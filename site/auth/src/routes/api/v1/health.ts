import { createFileRoute } from "@tanstack/react-router";

import { AUTH_API_VERSION } from "@beskid/auth-client";

export const Route = createFileRoute("/api/v1/health")({
	server: {
		handlers: {
			GET: async () =>
				Response.json({ ok: true as const, version: AUTH_API_VERSION }),
		},
	},
});

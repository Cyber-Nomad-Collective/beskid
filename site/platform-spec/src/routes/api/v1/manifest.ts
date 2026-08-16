import { createFileRoute } from "@tanstack/react-router";

import { loadManifest } from "#/lib/manifest/loader";

export const Route = createFileRoute("/api/v1/manifest")({
	server: {
		handlers: {
			GET: async () => Response.json(loadManifest()),
		},
	},
});

import { createFileRoute } from "@tanstack/react-router";

import { openApiV1Document } from "#/server/openapi-v1";

export const Route = createFileRoute("/api/v1/openapi/json")({
	server: {
		handlers: {
			GET: async () => Response.json(openApiV1Document),
		},
	},
});

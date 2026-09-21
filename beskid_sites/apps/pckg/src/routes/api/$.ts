import { createFileRoute } from "@tanstack/react-router";
import { env } from "#/env.server";
import { buildPckgProxyRequest } from "#/server/pckg-proxy";

export const Route = createFileRoute("/api/$")({
	server: {
		handlers: {
			ANY: async ({ request }) =>
				fetch(await buildPckgProxyRequest(request, env.PCKG_REGISTRY_ORIGIN)),
		},
	},
});

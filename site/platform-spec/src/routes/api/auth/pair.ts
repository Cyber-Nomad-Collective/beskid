import { createFileRoute } from "@tanstack/react-router";

import { respondToHubPairingLink } from "#/lib/auth/hub-pairing-handler.server";

export const Route = createFileRoute("/api/auth/pair")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const response = await respondToHubPairingLink(request);
				if (response) return response;
				return new Response("Missing pairing code", { status: 400 });
			},
		},
	},
});

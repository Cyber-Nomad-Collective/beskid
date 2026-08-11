import { createFileRoute } from "@tanstack/react-router";

import { pairingAppIdSchema } from "#/lib/pairing-app-id";
import { getPairedApp } from "#/server/repositories/paired-apps";

export const Route = createFileRoute("/api/v1/pairing/status")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const appId = url.searchParams.get("appId") ?? "";
				const parsed = pairingAppIdSchema.safeParse(appId);
				if (!parsed.success) {
					return Response.json({ error: "Invalid appId" }, { status: 400 });
				}

				const row = getPairedApp(parsed.data);
				return Response.json({
					appId: parsed.data,
					paired: row !== null,
					publicUrl: row?.public_url,
				});
			},
		},
	},
});

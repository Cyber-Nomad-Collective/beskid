import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { pairingAppIdSchema } from "#/lib/pairing-app-id";
import { requireHubAdmin } from "#/server/hub-admin";
import { createPairingRequest } from "#/server/repositories/pairing";

const bodySchema = z.object({
	appId: pairingAppIdSchema,
	publicUrl: z.string().url(),
});

export const Route = createFileRoute("/api/v1/pairing/requests")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const admin = await requireHubAdmin(request);
				if (!admin) {
					return Response.json({ error: "Hub admin required" }, { status: 401 });
				}

				let json: unknown;
				try {
					json = await request.json();
				} catch {
					return Response.json({ error: "Invalid JSON" }, { status: 400 });
				}

				const parsed = bodySchema.safeParse(json);
				if (!parsed.success) {
					return Response.json({ error: "Invalid payload" }, { status: 400 });
				}

				const result = createPairingRequest({
					appId: parsed.data.appId,
					publicUrl: parsed.data.publicUrl,
					createdByLogin: admin.login,
				});

				return Response.json(result);
			},
		},
	},
});

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { submitAuthHubSetup } from "#/server/auth-hub-setup.server";

const bodySchema = z.object({
	authHubPublicUrl: z.string().url().optional(),
	pairingCode: z.string().min(4),
	platformSpecPublicUrl: z.string().url(),
	approverLogin: z.string().min(1),
	setupToken: z.string().min(1).optional(),
});

export const Route = createFileRoute("/api/admin/setup")({
	server: {
		handlers: {
			POST: async ({ request }) => {
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

				const result = await submitAuthHubSetup(request, parsed.data);
				if ("error" in result) {
					return Response.json({ error: result.error }, { status: result.status });
				}
				return Response.json({ ok: true });
			},
		},
	},
});

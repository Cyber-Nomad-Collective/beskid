import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { approvePairing } from "#/server/repositories/pairing";

const bodySchema = z.object({
	code: z.string().min(4),
	appId: z.enum(["tracker", "nexus", "pckg"]),
	publicUrl: z.string().url(),
	approverLogin: z.string().min(1),
	approvalNonce: z.string().optional(),
});

export const Route = createFileRoute("/api/v1/pairing/approve")({
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

				const result = approvePairing({
					code: parsed.data.code,
					appId: parsed.data.appId,
					publicUrl: parsed.data.publicUrl,
					approverLogin: parsed.data.approverLogin,
				});

				if ("error" in result) {
					return Response.json({ error: result.error }, { status: 400 });
				}

				return Response.json({ serviceToken: result.serviceToken });
			},
		},
	},
});

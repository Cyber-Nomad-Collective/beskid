import { createFileRoute } from "@tanstack/react-router";

import { requireHubAdmin } from "#/server/hub-admin";
import {
	cancelPairingRequest,
	getPairingRequest,
	listPairingAudit,
} from "#/server/repositories/pairing";

export const Route = createFileRoute("/api/v1/pairing/requests/$requestId")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				const admin = await requireHubAdmin(request);
				if (!admin) {
					return Response.json({ error: "Hub admin required" }, { status: 401 });
				}

				const row = getPairingRequest(params.requestId);
				if (!row) {
					return Response.json({ error: "Not found" }, { status: 404 });
				}

				return Response.json({
					request: row,
					audit: listPairingAudit(row.id),
					approveUrlTemplate: `${row.public_url.replace(/\/$/, "")}/settings/auth/pair?code=<code>`,
				});
			},
			DELETE: async ({ request, params }) => {
				const admin = await requireHubAdmin(request);
				if (!admin) {
					return Response.json({ error: "Hub admin required" }, { status: 401 });
				}

				const result = cancelPairingRequest(params.requestId, admin.login);
				if ("error" in result) {
					return Response.json({ error: result.error }, { status: 400 });
				}

				return Response.json({ ok: true });
			},
		},
	},
});

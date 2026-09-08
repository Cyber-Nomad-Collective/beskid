import { createFileRoute } from "@tanstack/react-router";

import { pairingAppIdSchema } from "#/lib/pairing-app-id";
import { requireHubAdmin } from "#/server/hub-admin";
import {
	cancelPairingRequest,
	getPairingRequest,
	listPairingAudit,
	pairingApproveUrl,
} from "#/server/repositories/pairing";

export async function getPairingRequestDetail(input: {
	request: Request;
	params: { requestId: string };
}): Promise<Response> {
	const admin = await requireHubAdmin(input.request);
	if (!admin) {
		return Response.json({ error: "Hub admin required" }, { status: 401 });
	}

	const row = getPairingRequest(input.params.requestId);
	if (!row) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}
	const appId = pairingAppIdSchema.safeParse(row.app_id);
	if (!appId.success) {
		return Response.json({ error: "Unsupported app id" }, { status: 409 });
	}

	return Response.json({
		request: row,
		audit: listPairingAudit(row.id),
		approveUrlTemplate: pairingApproveUrl(row.public_url, appId.data, "<code>"),
	});
}

export const Route = createFileRoute("/api/v1/pairing/requests/$requestId")({
	server: {
		handlers: {
			GET: getPairingRequestDetail,
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

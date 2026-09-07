import { describe, expect, it, vi } from "vitest";

const { pairingApproveUrl } = vi.hoisted(() => ({
	pairingApproveUrl: vi.fn(),
}));

vi.mock("#/server/hub-admin", () => ({
	requireHubAdmin: vi.fn().mockResolvedValue({ login: "admin" }),
}));

vi.mock("#/server/repositories/pairing", () => ({
	cancelPairingRequest: vi.fn(),
	getPairingRequest: vi.fn().mockReturnValue({
		id: "request-1",
		app_id: "platform-spec",
		public_url: "https://spec.beskid-lang.org:8460",
		code_hash: "legacy",
		expires_at: "2026-09-08T00:00:00Z",
		created_by_login: "admin",
		status: "pending",
		created_at: "2026-09-07T00:00:00Z",
	}),
	listPairingAudit: vi.fn().mockReturnValue([]),
	pairingApproveUrl,
}));

import { getPairingRequestDetail } from "#/routes/api/v1/pairing/requests/$requestId";

describe("pairing request detail", () => {
	it("rejects a persisted request for a retired service id", async () => {
		const response = await getPairingRequestDetail({
			request: new Request(
				"https://auth.beskid-lang.org:8090/api/v1/pairing/requests/request-1",
			),
			params: { requestId: "request-1" },
		});

		expect(response.status).toBe(409);
		expect(pairingApproveUrl).not.toHaveBeenCalled();
	});
});

import { createServerFn } from "@tanstack/react-start";

import {
	loadAdminDashboard,
	loadHomeData,
	loadLoginPageContext,
	loadOnboardingGate,
	loadPairingRequestDetail,
	loadPairingRequests,
	loadProfileData,
	resolveAdminAccess,
} from "#/server/app-server.server";

export const fetchHomeData = createServerFn({ method: "GET" }).handler(
	async () => loadHomeData(),
);

export const fetchLoginPageContext = createServerFn({ method: "GET" }).handler(
	async () => loadLoginPageContext(),
);

export const fetchProfileData = createServerFn({ method: "GET" }).handler(
	async () => loadProfileData(),
);

export const fetchAdminAccess = createServerFn({ method: "GET" }).handler(
	async () => resolveAdminAccess(),
);

export const fetchAdminDashboard = createServerFn({ method: "GET" }).handler(
	async () => loadAdminDashboard(),
);

export const fetchOnboardingGate = createServerFn({ method: "GET" }).handler(
	async () => loadOnboardingGate(),
);

export const fetchPairingRequests = createServerFn({ method: "GET" }).handler(
	async () => loadPairingRequests(),
);

export const fetchPairingRequestDetail = createServerFn({ method: "GET" })
	.inputValidator((data: { requestId: string }) => data)
	.handler(async ({ data }) => loadPairingRequestDetail(data.requestId));

export const cancelPairingRequestFn = createServerFn({ method: "POST" })
	.inputValidator((data: { requestId: string }) => data)
	.handler(async ({ data }) => {
		const access = await resolveAdminAccess();
		if (access.kind !== "ok") {
			throw new Error("Hub admin required");
		}
		const { cancelPairingRequest } = await import(
			"#/server/repositories/pairing"
		);
		const result = cancelPairingRequest(data.requestId, access.session.login);
		if ("error" in result) {
			throw new Error(result.error);
		}
		return { ok: true as const };
	});

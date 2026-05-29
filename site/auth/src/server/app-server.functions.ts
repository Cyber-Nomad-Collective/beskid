import { createServerFn } from "@tanstack/react-start";

import {
	loadHomeData,
	loadLoginPageContext,
	loadOnboardingGate,
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

export const fetchOnboardingGate = createServerFn({ method: "GET" }).handler(
	async () => loadOnboardingGate(),
);

export const fetchPairingRequests = createServerFn({ method: "GET" }).handler(
	async () => loadPairingRequests(),
);

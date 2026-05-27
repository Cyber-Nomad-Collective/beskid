import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import {
	isAdminLogin,
	isOnboarded,
	listEnabledApps,
} from "#/server/config-store";
import { getSessionFromRequest } from "#/server/session";

export const fetchHomeData = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getRequest();
		const [apps, session] = await Promise.all([
			listEnabledApps(),
			getSessionFromRequest(request),
		]);
		return { apps, session };
	},
);

export const fetchProfileData = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getRequest();
		const session = await getSessionFromRequest(request);
		if (!session) return null;
		const apps = await listEnabledApps();
		return { session, apps };
	},
);

export const fetchAdminAccess = createServerFn({ method: "GET" }).handler(
	async () => {
		if (!(await isOnboarded())) return { kind: "onboarding" as const };
		const session = await getSessionFromRequest(getRequest());
		if (!session) return { kind: "login" as const };
		if (!(await isAdminLogin(session.login))) {
			return { kind: "profile" as const };
		}
		return { kind: "ok" as const, session };
	},
);

export const fetchOnboardingGate = createServerFn({ method: "GET" }).handler(
	async () => ({ onboarded: await isOnboarded() }),
);

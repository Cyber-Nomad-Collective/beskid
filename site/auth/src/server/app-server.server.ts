import { getRequest } from "@tanstack/react-start/server";

import {
	isAdminLogin,
	isOnboarded,
	listEnabledApps,
} from "#/server/config-store";
import { hubOAuthCallbackUrl, hubPublicBase } from "#/server/hub-public.server";
import { getAdminLogins } from "#/server/hub-admin-bootstrap.server";
import { listPairingRequests } from "#/server/repositories/pairing";
import { getSessionFromRequest } from "#/server/session";

export async function resolveAdminAccess() {
	if (!(await isOnboarded())) return { kind: "onboarding" as const };
	const session = await getSessionFromRequest(getRequest());
	if (!session) return { kind: "login" as const };
	if (!(await isAdminLogin(session.login))) {
		return { kind: "profile" as const };
	}
	return { kind: "ok" as const, session, hubBase: hubPublicBase() };
}

export async function loadHomeData() {
	const request = getRequest();
	const [apps, session] = await Promise.all([
		listEnabledApps(),
		getSessionFromRequest(request),
	]);
	return { apps, session, hubBase: hubPublicBase() };
}

export async function loadLoginPageContext() {
	return { hubBase: hubPublicBase() };
}

export async function loadProfileData() {
	const request = getRequest();
	const session = await getSessionFromRequest(request);
	if (!session) return null;
	const [apps, isAdmin] = await Promise.all([
		listEnabledApps(),
		isAdminLogin(session.login),
	]);
	return { session, apps, isAdmin };
}

export async function loadAdminDashboard() {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") return access;
	return {
		kind: "ok" as const,
		session: access.session,
		hubBase: access.hubBase,
		admins: getAdminLogins(),
	};
}

export async function loadOnboardingGate() {
	return {
		onboarded: await isOnboarded(),
		defaultCallback: hubOAuthCallbackUrl(),
	};
}

export async function loadPairingRequests() {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") return access;
	return { kind: "ok" as const, requests: listPairingRequests() };
}

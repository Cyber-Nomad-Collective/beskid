import { getRequest } from "@tanstack/react-start/server";

import {
	isAdminLogin,
	isOnboarded,
	listEnabledApps,
} from "#/server/config-store";
import { getAdminLogins } from "#/server/hub-admin-bootstrap.server";
import { hubOAuthCallbackUrl, hubPublicBase } from "#/server/hub-public.server";
import {
	getPairingRequest,
	createPairingRequest,
	listPairingAudit,
	listPairingRequests,
} from "#/server/repositories/pairing";
import {
	getServiceTokenForApp,
	listActivePairedApps,
	type PairedAppRow,
} from "#/server/repositories/paired-apps";
import { pairingAppIdSchema } from "#/lib/pairing-app-id";
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

export async function loadPairingRequestDetail(requestId: string) {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") return access;

	const request = getPairingRequest(requestId);
	if (!request) {
		return { kind: "not_found" as const };
	}

	return {
		kind: "ok" as const,
		request,
		audit: listPairingAudit(requestId),
	};
}

const repairPaths: Record<string, string> = {
	tracker: "/api/admin/auth/pair",
	"platform-spec": "/api/admin/setup",
	nexus: "/api/admin/auth/pair",
	pckg: "/api/auth/hub/pair",
};

export async function loadAdminPairingRepairTargets(input: {
	appId?: string;
	force?: boolean;
}) {
	const access = await resolveAdminAccess();
	if (access.kind !== "ok") {
		return { kind: "forbidden" as const };
	}

	if (input.appId) {
		const parsed = pairingAppIdSchema.safeParse(input.appId);
		if (!parsed.success) {
			return { kind: "invalid" as const, error: "Invalid appId" };
		}
	}

	const targets = listActivePairedApps().filter((row) =>
		input.appId ? row.id === input.appId : true,
	);
	const results = {
		repaired: [] as string[],
		skipped: [] as string[],
		failed: [] as { appId: string; error: string }[],
	};

	for (const row of targets as PairedAppRow[]) {
		const rowAppId = pairingAppIdSchema.safeParse(row.id);
		if (!rowAppId.success) {
			results.failed.push({
				appId: row.id,
				error: "Unsupported service id",
			});
			continue;
		}
		const repairPath = repairPaths[row.id];
		if (!repairPath) {
			results.skipped.push(row.id);
			continue;
		}
		const serviceToken = getServiceTokenForApp(row.id);
		if (!serviceToken) {
			results.failed.push({
				appId: row.id,
				error: "Missing service token for repair",
			});
			continue;
		}
		const targetPublicUrl = row.public_url.replace(/\/$/, "");
		const request = createPairingRequest({
			appId: rowAppId.data,
			publicUrl: targetPublicUrl,
			createdByLogin: access.session.login,
		});
		const pairingPayload: Record<string, unknown> = {};
		if (row.id === "platform-spec") {
			pairingPayload.pairingCode = request.pairingCode;
			pairingPayload.platformSpecPublicUrl = targetPublicUrl;
			pairingPayload.forceRepair = true;
		} else if (row.id === "pckg") {
			pairingPayload.code = request.pairingCode;
			pairingPayload.publicUrl = targetPublicUrl;
			pairingPayload.force = true;
		} else {
			pairingPayload.code = request.pairingCode;
			pairingPayload.publicUrl = targetPublicUrl;
		}
		pairingPayload.approverLogin = access.session.login;
		try {
			const response = await fetch(`${targetPublicUrl}${repairPath}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${serviceToken}`,
				},
				body: JSON.stringify(pairingPayload),
			});
			if (!response.ok) {
				const body = (await response.text()) || "Pairing repair failed";
				results.failed.push({ appId: row.id, error: body });
				continue;
			}
			results.repaired.push(row.id);
		} catch (error) {
			results.failed.push({
				appId: row.id,
				error: error instanceof Error ? error.message : "Pairing repair failed",
			});
		}
	}

	if (results.failed.length) {
		return {
			kind: "partial" as const,
			...results,
		};
	}
	return { kind: "ok" as const, ...results };
}

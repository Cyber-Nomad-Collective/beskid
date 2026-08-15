import "@tanstack/react-start/server-only";

import { getRequest } from "@tanstack/react-start/server";

import { env } from "#/env.server";
import {
	approveAuthHubPairing as approveAuthHubPairingShared,
	type AuthHubPairingFailureReason,
	pairingFailureMessage as pairingFailureMessageShared,
} from "@beskid/auth-client";
import {
	getStoredPairingApproverLogin,
	saveAuthHubPairing,
} from "#/lib/auth/hub-settings.server";
import { canManageRoadmap } from "#/lib/github/permissions";
import { getSessionFromRequest } from "#/lib/session/cookie";
import { createOctokitForSession } from "#/server/auth-guard.server";

/** Public origin sent to the auth hub when approving pairing. */
export function resolvePlatformSpecPublicUrlForPairing(): string {
	const fromEnv = env.PLATFORM_SPEC_PUBLIC_URL?.trim().replace(/\/$/, "");
	if (fromEnv) return fromEnv;
	const request = getRequest();
	return new URL(request.url).origin;
}

export function pairingFailureMessage(
	reason: "auth_required" | "not_configured" | "invalid",
): string {
	if (reason === "auth_required") {
		return "Server cannot approve pairing: set PLATFORM_SPEC_PAIRING_APPROVER_LOGIN or sign in as a repo admin.";
	}
	return pairingFailureMessageShared(reason as AuthHubPairingFailureReason, {
		approverHint: "set PLATFORM_SPEC_PAIRING_APPROVER_LOGIN or sign in as a repo admin.",
	});
}

async function resolvePairingApproverLogin(): Promise<string | null> {
	const configured = env.PLATFORM_SPEC_PAIRING_APPROVER_LOGIN?.trim();
	if (configured) {
		return configured;
	}

	const stored = getStoredPairingApproverLogin()?.trim();
	if (stored) {
		return stored;
	}

	const request = getRequest();
	const session = await getSessionFromRequest(request);

	if (session) {
		const octokit = createOctokitForSession(session);
		if (await canManageRoadmap(octokit, session.login)) {
			return session.login;
		}
	}

	return null;
}

/** Same contract as Beskid Nexus `POST /api/admin/auth/pair`. */
export async function approveAuthHubPairing(input: {
	code: string;
	publicUrl: string;
	approverLogin: string;
}): Promise<
	{ ok: true } | { ok: false; reason: "not_configured" | "invalid" }
> {
	const code = input.code.trim();
	const publicUrl = input.publicUrl.trim().replace(/\/$/, "");
	const approverLogin = input.approverLogin.trim();
	if (!code || !publicUrl || !approverLogin) {
		return { ok: false, reason: "invalid" };
	}

	const hubUrl = env.AUTH_HUB_PUBLIC_URL?.trim();
	if (!hubUrl) {
		return { ok: false, reason: "not_configured" };
	}

	const result = await approveAuthHubPairingShared({
		hubUrl,
		appId: "platform-spec",
		code,
		publicUrl,
		approverLogin,
	});
	if (!result.ok) {
		return { ok: false, reason: result.reason };
	}

	saveAuthHubPairing(hubUrl, result.serviceToken);
	return { ok: true };
}

/** Server-side autopair (hub link or sync token). */
export async function completeAuthHubPairing(input: {
	code: string;
	publicUrl: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: "auth_required" | "not_configured" | "invalid" }
> {
	const code = input.code.trim();
	const publicUrl = input.publicUrl.trim().replace(/\/$/, "");
	if (!code || !publicUrl) {
		return { ok: false, reason: "invalid" };
	}

	const approverLogin = await resolvePairingApproverLogin();
	if (!approverLogin) {
		return { ok: false, reason: "auth_required" };
	}

	const result = await approveAuthHubPairing({
		code,
		publicUrl,
		approverLogin,
	});
	if (!result.ok) {
		return result;
	}
	return { ok: true };
}

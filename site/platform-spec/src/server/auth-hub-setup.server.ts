import "@tanstack/react-start/server-only";

import { env } from "#/env.server";
import {
	approveAuthHubPairing,
	resolvePlatformSpecPublicUrlForPairing,
} from "#/lib/auth/hub-pairing-flow.server";
import {
	getAuthHubUrl,
	getStoredPairingApproverLogin,
	isAuthHubPaired,
	savePairingApproverLogin,
} from "#/lib/auth/hub-settings.server";

export function getAuthHubSetupStatus() {
	return {
		authHubConfigured: isAuthHubPaired(),
		authHubUrl: getAuthHubUrl(),
		defaultAuthHubUrl: env.AUTH_HUB_PUBLIC_URL?.trim() ?? null,
		defaultPlatformSpecPublicUrl: resolvePlatformSpecPublicUrlForPairing(),
		storedApproverLogin: getStoredPairingApproverLogin(),
		hasSessionSecret: env.SESSION_SECRET.length >= 32,
		hasSetupToken: !!env.PLATFORM_SPEC_SETUP_TOKEN?.trim(),
	};
}

function verifySetupToken(
	request: Request,
	bodyToken?: string,
): boolean {
	const expected = env.PLATFORM_SPEC_SETUP_TOKEN?.trim();
	if (!expected) return true;

	const header = request.headers.get("authorization");
	if (header === `Bearer ${expected}`) return true;

	return (bodyToken?.trim() ?? "") === expected;
}

export async function submitAuthHubSetup(
	request: Request,
	input: {
		authHubPublicUrl?: string;
		pairingCode: string;
		platformSpecPublicUrl: string;
		approverLogin: string;
		setupToken?: string;
	},
): Promise<{ ok: true } | { error: string; status: number }> {
	const already = isAuthHubPaired();
	const setupTokenRequired = !!env.PLATFORM_SPEC_SETUP_TOKEN?.trim();

	if (already && !verifySetupToken(request, input.setupToken)) {
		return { error: "Auth hub already configured", status: 403 };
	}
	if (!already && setupTokenRequired && !verifySetupToken(request, input.setupToken)) {
		return { error: "Invalid setup token", status: 403 };
	}

	const approverLogin = input.approverLogin.trim().toLowerCase();
	const pairingCode = input.pairingCode.trim();
	const platformSpecPublicUrl = input.platformSpecPublicUrl
		.trim()
		.replace(/\/$/, "");

	if (!approverLogin) {
		return { error: "approverLogin is required", status: 400 };
	}
	if (!pairingCode) {
		return { error: "pairingCode is required", status: 400 };
	}
	if (!platformSpecPublicUrl) {
		return { error: "platformSpecPublicUrl is required", status: 400 };
	}

	const hubBase = (
		input.authHubPublicUrl?.trim() ||
		env.AUTH_HUB_PUBLIC_URL?.trim() ||
		getAuthHubUrl()?.trim() ||
		""
	).replace(/\/$/, "");

	if (!hubBase) {
		return {
			error: "authHubPublicUrl or AUTH_HUB_PUBLIC_URL is required",
			status: 400,
		};
	}

	try {
		const result = await approveAuthHubPairing({
			code: pairingCode,
			publicUrl: platformSpecPublicUrl,
			approverLogin,
		});
		if (!result.ok) {
			return {
				error:
					result.reason === "not_configured"
						? "AUTH_HUB_PUBLIC_URL is not configured"
						: "Invalid pairing request",
				status: 400,
			};
		}
		savePairingApproverLogin(approverLogin);
		return { ok: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Setup failed";
		return { error: message, status: 400 };
	}
}

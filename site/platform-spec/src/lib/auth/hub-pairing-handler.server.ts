import "@tanstack/react-start/server-only";

import {
	completeAuthHubPairing,
	pairingFailureMessage,
	resolvePlatformSpecPublicUrlForPairing,
} from "#/lib/auth/hub-pairing-flow.server";

function redirectToPairPage(
	request: Request,
	params: { pair_error?: string },
): Response {
	const url = new URL("/settings/auth/pair", request.url);
	if (params.pair_error) {
		url.searchParams.set("pair_error", params.pair_error);
	}
	return new Response(null, {
		status: 302,
		headers: { Location: `${url.pathname}${url.search}` },
	});
}

/** Hub pairing links with ?code= — server autopair, then redirect to the settings page. */
export async function respondToHubPairingLink(
	request: Request,
): Promise<Response | null> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code")?.trim();
	if (!code) return null;
	if (url.searchParams.get("pair_error")) {
		return null;
	}

	try {
		const result = await completeAuthHubPairing({
			code,
			publicUrl: resolvePlatformSpecPublicUrlForPairing(),
		});
		if (!result.ok) {
			return redirectToPairPage(request, {
				pair_error: pairingFailureMessage(result.reason),
			});
		}
		return redirectToPairPage(request, {});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Pairing failed";
		return redirectToPairPage(request, { pair_error: message });
	}
}

import { authHubLoginUrl } from "#/lib/auth/hub-handoff.server";
import { resolvePlatformSpecPublicUrlForPairing } from "#/lib/auth/hub-pairing-flow.server";
import { isAuthHubPaired } from "#/lib/auth/hub-settings.server";

export function getAuthHubPairingStatus() {
	return {
		paired: isAuthHubPaired(),
		defaultPublicUrl: resolvePlatformSpecPublicUrlForPairing(),
	};
}

export function getAuthHubLoginHref() {
	return { signInHref: authHubLoginUrl() ?? "/api/auth/github" };
}

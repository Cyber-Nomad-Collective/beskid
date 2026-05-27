import { env } from "#/env";

export const OAUTH_STATE_COOKIE = "beskid_auth_oauth_state";

function isProduction(): boolean {
	return env.NODE_ENV === "production";
}

export function oauthStateCookieHeader(state: string): string {
	const secure = isProduction() ? "; Secure" : "";
	return `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

export function readOAuthStateCookie(request: Request): string | null {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === OAUTH_STATE_COOKIE) {
			return decodeURIComponent(rest.join("="));
		}
	}
	return null;
}

export function clearOAuthStateCookieHeader(): string {
	return `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function buildOAuthState(nonce: string, app: string): string {
	return `${nonce}:${app}`;
}

export function parseOAuthState(state: string): { nonce: string; app: string } | null {
	const parts = state.split(":");
	if (parts.length < 2 || !parts[0] || !parts[1]) return null;
	return { nonce: parts[0], app: parts.slice(1).join(":") };
}

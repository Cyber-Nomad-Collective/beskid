import "@tanstack/react-start/server-only";

/**
 * OAuth2 state parameter cookie for the OIDC authorization-code flow.
 *
 * Prevents CSRF on the callback. Lifted from
 * `site/auth/src/server/oauth-cookies.ts` (same pattern, renamed for the
 * shell OIDC flow).
 */

export interface OidcStateConfig {
	/** OIDC state cookie name. */
	oidcStateCookieName: string;
	/** Whether cookies should carry the `Secure` flag (production). */
	isProduction: boolean;
}

export interface OidcState {
	oidcStateCookieHeader(state: string): string;
	clearOidcStateCookieHeader(): string;
	readOidcStateCookie(request: Request): string | null;
}

export function createOidcState(config: OidcStateConfig): OidcState {
	const secure = config.isProduction ? "; Secure" : "";
	return {
		oidcStateCookieHeader(state: string): string {
			return `${config.oidcStateCookieName}=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
		},
		clearOidcStateCookieHeader(): string {
			return `${config.oidcStateCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
		},
		readOidcStateCookie(request: Request): string | null {
			const header = request.headers.get("cookie");
			if (!header) return null;
			for (const part of header.split(";")) {
				const [name, ...rest] = part.trim().split("=");
				if (name === config.oidcStateCookieName) {
					try {
						return decodeURIComponent(rest.join("="));
					} catch {
						return null;
					}
				}
			}
			return null;
		},
	};
}

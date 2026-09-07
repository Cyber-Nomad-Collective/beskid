import { createFileRoute } from "@tanstack/react-router";

import {
	clearOidcStateCookieHeader,
	exchangeCode,
	readOidcStateCookie,
	session,
	verifyIdToken,
} from "#/server/shell-auth";

/**
 * OIDC callback: Authelia redirects here with `?code=...&state=...`.
 *
 * Validates the state against the cookie, exchanges the code for tokens,
 * verifies the ID token against Authelia's JWKS, seals the verified claims
 * into the session cookie, and redirects to `/`. On any failure it clears
 * the session cookie and redirects to `/` with an error.
 */
export const Route = createFileRoute("/api/auth/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code")?.trim() ?? "";
				const state = url.searchParams.get("state")?.trim() ?? "";
				const stored = readOidcStateCookie(request);
				const redirectUri = `${url.origin}/api/auth/callback`;

				const headers = new Headers();
				headers.append("Set-Cookie", clearOidcStateCookieHeader());

				if (!code || !state || !stored || state !== stored) {
					headers.set("Location", "/?error=oidc_state");
					return new Response(null, { status: 302, headers });
				}

				try {
					const tokens = await exchangeCode(code, redirectUri);
					const user = await verifyIdToken(tokens.id_token);
					if (!user) {
						throw new Error("id_token verification failed");
					}
					const sealed = await session.sealShellSession(user);
					headers.append("Set-Cookie", session.shellSessionCookieHeader(sealed));
					headers.set("Location", "/");
					return new Response(null, { status: 302, headers });
				} catch {
					headers.append("Set-Cookie", session.clearShellSessionCookieHeader());
					headers.set("Location", "/?error=oidc_failed");
					return new Response(null, { status: 302, headers });
				}
			},
		},
	},
});

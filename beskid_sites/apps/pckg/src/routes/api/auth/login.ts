import { createFileRoute } from "@tanstack/react-router";

import {
	buildAuthorizationUrl,
	oidcStateCookieHeader,
	readOidcStateCookie,
} from "#/server/shell-auth";

/**
 * Starts the OIDC authorization-code flow: redirects the browser to
 * Authelia's authorization endpoint. Authelia then authenticates the user
 * with GitHub (the sole identity provider) and redirects back to
 * `/api/auth/callback`.
 */
export const Route = createFileRoute("/api/auth/login")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const redirectUri = `${url.origin}/api/auth/callback`;

				// CSRF state: cookie + query param must match on callback.
				const stored = readOidcStateCookie(request);
				const state = stored ?? crypto.randomUUID();
				const authUrl = await buildAuthorizationUrl(state, redirectUri);

				const headers = new Headers();
				headers.set("Location", authUrl);
				if (!stored) {
					headers.append("Set-Cookie", oidcStateCookieHeader(state));
				}
				return new Response(null, { status: 302, headers });
			},
		},
	},
});

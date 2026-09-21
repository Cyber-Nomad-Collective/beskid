import { createFileRoute } from "@tanstack/react-router";

import {
	buildAuthorizationUrl,
	oidcStateCookieHeader,
	readOidcStateCookie,
} from "#/server/shell-auth";
import { env } from "#/env.server";

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
				// Production currently delegates authentication to the host's
				// Authentik outpost. Keep the copied OIDC flow available when its
				// client is configured, but never turn an unset deployment secret
				// into a public 500 response.
				if (
					!env.AUTHELIA_OIDC_ISSUER ||
					!env.SHELL_TEMPLATE_OIDC_CLIENT_ID ||
					!env.SHELL_TEMPLATE_OIDC_CLIENT_SECRET
				) {
					return Response.redirect(`${url.origin}/auth`, 302);
				}
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

import { createFileRoute } from "@tanstack/react-router";
import { env } from "#/env.server";
import { safeNextPath } from "#/lib/next-path";
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
				// Production currently delegates authentication to the host's
				// Authentik outpost. Keep the copied OIDC flow available when its
				// client is configured, but never turn an unset deployment secret
				// into a public 500 response.
				if (
					!env.AUTHELIA_OIDC_ISSUER ||
					!env.SHELL_TEMPLATE_OIDC_CLIENT_ID ||
					!env.SHELL_TEMPLATE_OIDC_CLIENT_SECRET
				) {
					// Start the Authentik outpost flow directly and come back to
					// the requested page (the dashboard by default).
					const next = safeNextPath(url.searchParams.get("next"));
					const start = new URL("/outpost.goauthentik.io/start", url.origin);
					start.searchParams.set("rd", new URL(next, url.origin).toString());
					return new Response(null, {
						status: 302,
						headers: { Location: start.toString() },
					});
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

import "@tanstack/react-start/server-only";

import { createShellAuth } from "@cyber-nomad-collective/beskid-shell-core/server";

import { env } from "#/env.server";

/**
 * Shell auth helpers for the tracker app.
 *
 * Wires the shared shell-core Authelia OIDC + session helpers to this app's
 * env. The shell-core package never reads app env directly — each app
 * resolves its own OIDC client id/secret and session secret and passes them
 * to `createShellAuth`.
 *
 * This module is server-only (it imports `@tanstack/react-start/server-only`),
 * so the TanStack Start import-protection plugin stubs it on the client.
 * The top-level `getShellUser` server fn lives in `#/server/shell-user` (not
 * here) so the plugin can RPC-bridge it; the `/api/auth/*` route handlers
 * inline the helpers below so the plugin can strip their `server.handlers`
 * on the client.
 */
export const shellAuth = createShellAuth({
	issuer: env.AUTHELIA_OIDC_ISSUER ?? "",
	clientId: env.TRACKER_OIDC_CLIENT_ID ?? "",
	clientSecret: env.TRACKER_OIDC_CLIENT_SECRET ?? "",
	sessionSecret: env.SESSION_SECRET ?? "",
	sessionCookieName: "beskid_shell_session",
	isProduction: env.NODE_ENV === "production",
});

export const {
	resolveShellUser,
	requireShellUser,
	requireShellGroup,
	session,
	buildAuthorizationUrl,
	exchangeCode,
	verifyIdToken,
	oidcStateCookieHeader,
	clearOidcStateCookieHeader,
	readOidcStateCookie,
} = shellAuth;

export const SESSION_COOKIE_NAME = shellAuth.SESSION_COOKIE_NAME;

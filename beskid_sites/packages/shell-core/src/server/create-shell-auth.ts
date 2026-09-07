import "@tanstack/react-start/server-only";

import type { ShellAuthConfig, ShellUser } from "../types";
import {
	createResolveShellUser,
	getShellAuthMode,
	requireShellGroup,
	requireShellUser,
} from "./authelia-middleware";
import { createOidcClient } from "./oidc";
import { createOidcState } from "./oidc-state";
import { createShellSession, type ShellSession } from "./shell-session";

export { getShellAuthMode, requireShellGroup, requireShellUser };

/**
 * The shell auth helpers returned by {@link createShellAuth}.
 *
 * Each app calls `createShellAuth` once with its own OIDC + session config
 * (read from its env) and consumes the resulting helpers across its
 * routes, `beforeLoad` guards, and `/api/auth/*` file routes.
 *
 * NOTE: the TanStack Start `getShellUser` server fn and the `/api/auth/*`
 * route handlers are **not** created here. They must be defined at the top
 * level of the app's own source so the TanStack Start import-protection
 * plugin can RPC-bridge the server fn and strip the route `server.handlers`
 * on the client. A `createServerFn` call inside this factory (a workspace
 * package) would not be detected by the plugin and would leak server
 * runtime code into the client bundle. Apps wire the helpers below into
 * their own top-level `getShellUser` and inline route handlers.
 */
export interface ShellAuth {
	/** Session cookie name (read by `getShellUser` / route handlers). */
	readonly SESSION_COOKIE_NAME: string;

	/** Resolve the {@link ShellUser} for the current request. */
	resolveShellUser(sessionToken: string | null): Promise<ShellUser | null>;
	/** Pure guard: require an authenticated user, else throw. */
	requireShellUser(user: ShellUser | null): ShellUser;
	/** Pure guard: require membership in the given Authelia group. */
	requireShellGroup(user: ShellUser | null, group: string): ShellUser;

	/** Session cookie seal/unseal + cookie headers. */
	session: ShellSession;

	/** OIDC client (authorization URL, token exchange, ID token verify). */
	buildAuthorizationUrl(state: string, redirectUri: string): Promise<string>;
	exchangeCode(
		code: string,
		redirectUri: string,
	): Promise<{
		id_token?: string;
		access_token?: string;
		token_type?: string;
	}>;
	verifyIdToken(idToken: string | undefined): Promise<ShellUser | null>;

	/** OIDC state cookie helpers (CSRF on the callback). */
	oidcStateCookieHeader(state: string): string;
	clearOidcStateCookieHeader(): string;
	readOidcStateCookie(request: Request): string | null;
}

/**
 * Build a per-app shell auth helper bundle.
 *
 * @param config Per-app OIDC + session config. Each app reads its own env
 * (e.g. `SHELL_TEMPLATE_OIDC_CLIENT_ID`, `PLATFORM_SPEC_OIDC_CLIENT_ID`,
 * `TRACKER_OIDC_CLIENT_ID`) and passes the resolved values here. The
 * shell-core package never reads app env directly.
 */
export function createShellAuth(config: ShellAuthConfig): ShellAuth {
	const session = createShellSession({
		sessionSecret: config.sessionSecret,
		sessionCookieName: config.sessionCookieName ?? "beskid_shell_session",
		isProduction: config.isProduction,
	});
	const oidc = createOidcClient({
		issuer: config.issuer,
		clientId: config.clientId,
		clientSecret: config.clientSecret,
	});
	const oidcState = createOidcState({
		oidcStateCookieName: config.oidcStateCookieName ?? "beskid_shell_oidc_state",
		isProduction: config.isProduction,
	});
	const resolveShellUser = createResolveShellUser(session);

	return {
		SESSION_COOKIE_NAME: session.SESSION_COOKIE_NAME,
		resolveShellUser,
		requireShellUser,
		requireShellGroup,
		session,

		buildAuthorizationUrl: oidc.buildAuthorizationUrl,
		exchangeCode: oidc.exchangeCode,
		verifyIdToken: oidc.verifyIdToken,

		oidcStateCookieHeader: oidcState.oidcStateCookieHeader,
		clearOidcStateCookieHeader: oidcState.clearOidcStateCookieHeader,
		readOidcStateCookie: oidcState.readOidcStateCookie,
	};
}

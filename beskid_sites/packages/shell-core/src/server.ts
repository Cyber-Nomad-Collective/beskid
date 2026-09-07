/**
 * Server entry — Authelia OIDC + session auth factory for TanStack Start apps.
 *
 * Each app calls `createShellAuth(config)` once (reading its own env) and
 * consumes the returned helpers across its routes, `beforeLoad` guards, and
 * `/api/auth/*` file routes. The TanStack Start `getShellUser` server fn and
 * the `/api/auth/*` route handlers are defined in app source (not here) so
 * the import-protection plugin can RPC-bridge / strip them — see
 * `createShellAuth` docs.
 *
 * This module is server-only — importing it from a client bundle fails
 * closed via the `@tanstack/react-start/server-only` guards in the
 * underlying modules.
 */

export { getMockShellUser } from "./server/authelia-middleware";
export type { ShellAuth } from "./server/create-shell-auth";
export {
	createShellAuth,
	getShellAuthMode,
	requireShellGroup,
	requireShellUser,
} from "./server/create-shell-auth";
export type { OidcClient, OidcClientConfig } from "./server/oidc";
export { claimsToShellUser, createOidcClient } from "./server/oidc";
export type { OidcState, OidcStateConfig } from "./server/oidc-state";
export { createOidcState } from "./server/oidc-state";
export type { ShellSession, ShellSessionConfig } from "./server/shell-session";
export { createShellSession } from "./server/shell-session";

export type { ShellAuthConfig, ShellAuthMode, ShellUser } from "./types";

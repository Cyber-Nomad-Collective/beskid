import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core/client";

import type { AuthUser } from "../services/nexus-api";

/**
 * Client-side shell user resolution for the SPA.
 *
 * The shell template resolves the user server-side via a TanStack Start
 * server fn (`getShellUser`) that reads the Authelia-sealed session cookie.
 * The nexus app is a Vite SPA with no server fns, so it cannot call that
 * fn directly. Until the app is converted to TanStack Start (see
 * `MIGRATION-NOTES.md`), we resolve the user client-side:
 *
 *   - `SHELL_AUTH_MODE=mock` → return a fake admin user (dev without a
 *     backend). The mock is also an `AuthUser` so the settings dialog and
 *     Connect MCP button render in dev.
 *   - otherwise → `null`; the nexus app's existing `fetchAuthMe` flow
 *     (same-origin `/api/auth/me` against the gitnexus backend) remains
 *     the source of truth for `AuthUser`, and `authUserToShellUser` adapts
 *     it for the topbar avatar.
 *
 * Full Authelia (OIDC) integration for the SPA is a future task.
 */

const MOCK_AUTH_USER: AuthUser = {
	login: "nexus-dev",
	name: "Nexus Dev (mock)",
	avatarUrl: "https://github.com/nexus-dev.png",
	isAdmin: true,
	ownedRepoIds: [],
};

const MOCK_SHELL_USER: ShellUser = {
	username: "nexus-dev",
	name: "Nexus Dev (mock)",
	email: "nexus-dev@example.com",
	groups: ["nexus-admins"],
	avatarUrl: "https://github.com/nexus-dev.png",
};

/** True when the SPA should bypass the backend auth flow (dev convenience). */
export function isShellAuthMock(): boolean {
	return import.meta.env.SHELL_AUTH_MODE === "mock";
}

/** Mock `AuthUser` used when `SHELL_AUTH_MODE=mock`. */
export function mockAuthUser(): AuthUser {
	return MOCK_AUTH_USER;
}

/** Mock `ShellUser` used when `SHELL_AUTH_MODE=mock`. */
export function mockShellUser(): ShellUser {
	return MOCK_SHELL_USER;
}

/** Map the nexus `AuthUser` (from `/api/auth/me`) to the shell `ShellUser`. */
export function authUserToShellUser(auth: AuthUser | null): ShellUser | null {
	if (!auth) return null;
	return {
		username: auth.login,
		name: auth.name ?? auth.login,
		avatarUrl: auth.avatarUrl,
		groups: auth.isAdmin ? ["nexus-admins"] : [],
	};
}

import "@tanstack/react-start/server-only";

import type { ShellAuthMode, ShellUser } from "../types";
import type { ShellSession } from "./shell-session";

/**
 * Authelia auth helpers for the shell.
 *
 * - `getShellAuthMode()` reads `SHELL_AUTH_MODE` at call time (`authelia` vs
 *   `mock`). `mock` returns a fake user so the shell renders without an
 *   Authelia instance in front of it.
 * - `requireShellUser` / `requireShellGroup` are pure guard helpers.
 * - `createResolveShellUser(session)` builds the request-time resolver that
 *   unseals the signed session cookie in `authelia` mode.
 */

const MOCK_USER: ShellUser = {
	username: "beskid-dev",
	email: "beskid-dev@example.com",
	name: "Beskid Dev",
	groups: ["beskid-admins", "dev"],
	avatarUrl: "https://github.com/beskid-dev.png",
};

export function getShellAuthMode(): ShellAuthMode {
	const mode = process.env.SHELL_AUTH_MODE ?? "mock";
	return mode === "authelia" ? "authelia" : "mock";
}

/** The mock user returned in `mock` mode (dev without Authelia). */
export function getMockShellUser(): ShellUser {
	return MOCK_USER;
}

/**
 * Resolve the {@link ShellUser} for the current request.
 *
 * In `authelia` mode, unseals the signed session cookie (set by
 * `/api/auth/callback` after the Authelia ID token is verified). In `mock`
 * mode, returns a fixed fake user. Returns `null` when no valid session is
 * present (unauthenticated request on a public route).
 */
export function createResolveShellUser(session: ShellSession) {
	return async function resolveShellUser(
		sessionToken: string | null,
	): Promise<ShellUser | null> {
		if (getShellAuthMode() === "mock") {
			return MOCK_USER;
		}
		if (!sessionToken) return null;
		return session.unsealShellSession(sessionToken);
	};
}

/**
 * Guard helper: require an authenticated user, else throw.
 *
 * Route handlers call this in `beforeLoad` to enforce auth on protected
 * routes. Public routes skip it.
 */
export function requireShellUser(user: ShellUser | null): ShellUser {
	if (!user) {
		throw new Error("requireShellUser: unauthenticated");
	}
	return user;
}

/**
 * Guard helper: require membership in one of the given Authelia groups.
 */
export function requireShellGroup(
	user: ShellUser | null,
	group: string,
): ShellUser {
	const resolved = requireShellUser(user);
	if (!resolved.groups.includes(group)) {
		throw new Error(`requireShellGroup: missing group ${group}`);
	}
	return resolved;
}

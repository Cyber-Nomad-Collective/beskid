import "@tanstack/react-start/server-only";

import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import { getCookie } from "@tanstack/react-start/server";
import type { AuthUser } from "#/lib/github/types";
import { resolveShellUser, SESSION_COOKIE_NAME } from "#/server/shell-auth";

/**
 * Resolve the tracker {@link AuthUser} for the current request.
 *
 * Replaces the old hub-session reader. The Authelia ShellUser is unsealed from
 * the signed session cookie and mapped to the tracker's AuthUser shape
 * (`{ login, name, avatarUrl }`). Returns null on unauthenticated requests.
 */
export async function resolveAuthUser(): Promise<AuthUser | null> {
	const token = getCookie(SESSION_COOKIE_NAME) ?? null;
	const user: ShellUser | null = await resolveShellUser(token);
	if (!user) return null;
	return {
		login: user.username,
		name: user.name ?? null,
		avatarUrl: user.avatarUrl ?? `https://github.com/${user.username}.png`,
	};
}

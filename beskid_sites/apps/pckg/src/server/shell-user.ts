import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import { createServerFn } from "@tanstack/react-start";
import { resolveShellUser, SESSION_COOKIE_NAME } from "#/server/shell-auth";

/**
 * Resolve the {@link ShellUser} for the current Nitro request.
 *
 * Implemented as a TanStack Start server function so the import-protection
 * plugin RPC-bridges it on the client (the client gets a fetcher stub, the
 * server runs the handler). The server-only `getCookie` is imported
 * dynamically inside the handler so this module's top level stays
 * client-safe.
 *
 * Reads the signed session cookie (set by `/api/auth/callback` after the
 * Authelia ID token is verified) — not forward-auth headers.
 */
export const getShellUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<ShellUser | null> => {
		const { getCookie } = await import("@tanstack/react-start/server");
		const sessionToken = getCookie(SESSION_COOKIE_NAME) ?? null;
		return resolveShellUser(sessionToken);
	},
);

import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import { shellUserFromForwardAuthHeaders } from "@cyber-nomad-collective/beskid-shell-core/server";
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
 * Reads the signed session cookie when the app owns an OIDC session. In the
 * production Authentik mode, falls back to the identity headers copied by the
 * trusted edge forward-auth boundary.
 */
export const getShellUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<ShellUser | null> => {
		const { getCookie, getRequest } = await import(
			"@tanstack/react-start/server"
		);
		const sessionToken = getCookie(SESSION_COOKIE_NAME) ?? null;
		const sessionUser = await resolveShellUser(sessionToken);
		if (sessionUser) return sessionUser;
		return shellUserFromForwardAuthHeaders(getRequest().headers);
	},
);

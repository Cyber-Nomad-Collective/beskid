import { createFileRoute } from "@tanstack/react-router";

import { session } from "#/server/shell-auth";

/**
 * Clears the shell session cookie and redirects to `/`.
 *
 * This ends the platform-spec session only. To also end the Authelia SSO
 * session, the deployment can point the user-menu sign-out link at
 * Authelia's `/logout` endpoint instead.
 */
export const Route = createFileRoute("/api/auth/logout")({
	server: {
		handlers: {
			POST: () => {
				const headers = new Headers();
				headers.append("Set-Cookie", session.clearShellSessionCookieHeader());
				headers.set("Location", "/");
				return new Response(null, { status: 302, headers });
			},
			GET: () => {
				const headers = new Headers();
				headers.append("Set-Cookie", session.clearShellSessionCookieHeader());
				headers.set("Location", "/");
				return new Response(null, { status: 302, headers });
			},
		},
	},
});

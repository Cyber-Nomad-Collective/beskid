import { createFileRoute } from "@tanstack/react-router";

import { clearSessionCookieHeader } from "#/server/session";

export const Route = createFileRoute("/api/auth/logout")({
	server: {
		handlers: {
			POST: async () => {
				const headers = new Headers();
				headers.append("Set-Cookie", clearSessionCookieHeader());
				headers.set("Location", "/");
				return new Response(null, { status: 302, headers });
			},
			GET: async () => {
				const headers = new Headers();
				headers.append("Set-Cookie", clearSessionCookieHeader());
				headers.set("Location", "/");
				return new Response(null, { status: 302, headers });
			},
		},
	},
});

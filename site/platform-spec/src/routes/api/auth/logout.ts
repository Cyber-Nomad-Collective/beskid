import { createFileRoute } from "@tanstack/react-router";

import { clearSessionCookieHeader } from "#/lib/session/cookie";

export const Route = createFileRoute("/api/auth/logout")({
	server: {
		handlers: {
			POST: async () => {
				const headers = new Headers();
				headers.append("Set-Cookie", clearSessionCookieHeader());
				headers.set("Location", "/settings/auth/login");
				return new Response(null, { status: 302, headers });
			},
			GET: async () => {
				const headers = new Headers();
				headers.append("Set-Cookie", clearSessionCookieHeader());
				headers.set("Location", "/settings/auth/login");
				return new Response(null, { status: 302, headers });
			},
		},
	},
});

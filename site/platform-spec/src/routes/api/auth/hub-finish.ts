import { createFileRoute } from "@tanstack/react-router";

import { verifyHubHandoff } from "#/lib/auth/hub-handoff.server";
import {
	clearSessionCookieHeader,
	sealSession,
	sessionCookieHeader,
} from "#/lib/session/cookie";
import { readPostLoginRedirect } from "#/lib/session/post-login-redirect";
import { clearPostLoginRedirectCookieHeader } from "#/lib/session/post-login-redirect.server";

export const Route = createFileRoute("/api/auth/hub-finish")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const handoff = url.searchParams.get("handoff");
				const headers = new Headers();

				if (!handoff) {
					headers.set("Location", "/settings/auth/login?error=oauth_failed");
					return new Response(null, { status: 302, headers });
				}

				const payload = await verifyHubHandoff(handoff, "platform-spec");
				if (!payload) {
					headers.set("Location", "/settings/auth/login?error=oauth_failed");
					return new Response(null, { status: 302, headers });
				}

				try {
					const token = await sealSession({
						login: payload.login,
						avatarUrl: payload.avatarUrl,
						name: payload.name,
						hubUserToken: payload.hubUserToken,
						hubSessionId: payload.sessionId,
					});
					headers.append("Set-Cookie", sessionCookieHeader(token));

					const next = readPostLoginRedirect(request);
					headers.append("Set-Cookie", clearPostLoginRedirectCookieHeader());
					headers.set("Location", next ?? "/edit");
				} catch {
					headers.append("Set-Cookie", clearSessionCookieHeader());
					headers.set("Location", "/settings/auth/login?error=oauth_failed");
				}

				return new Response(null, { status: 302, headers });
			},
		},
	},
});

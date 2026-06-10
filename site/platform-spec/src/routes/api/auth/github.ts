import { createFileRoute } from "@tanstack/react-router";

import { authHubLoginUrl } from "#/lib/auth/hub-handoff.server";
import { postLoginRedirectCookieHeader } from "#/lib/session/post-login-redirect.server";
import { sanitizePostLoginPath } from "#/lib/session/post-login-redirect";

export const Route = createFileRoute("/api/auth/github")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const hubUrl = authHubLoginUrl();
				if (!hubUrl) {
					return new Response(
						"Auth hub is not configured. Set AUTH_HUB_PUBLIC_URL and complete pairing.",
						{ status: 503 },
					);
				}

				const url = new URL(request.url);
				const next = sanitizePostLoginPath(url.searchParams.get("next"));

				const headers = new Headers();
				if (next) {
					headers.append("Set-Cookie", postLoginRedirectCookieHeader(next));
				}
				headers.set("Location", hubUrl);
				return new Response(null, { status: 302, headers });
			},
		},
	},
});

import { createFileRoute, redirect } from "@tanstack/react-router";

import {
	buildHandoffFinishUrl,
	issueHandoffToken,
} from "@beskid/auth-client";
import {
	getAppById,
	resolveOAuthConfig,
} from "#/server/config-store";
import {
	exchangeGitHubCode,
	fetchGitHubUser,
} from "#/server/github-oauth";
import {
	buildOAuthState,
	clearOAuthStateCookieHeader,
	parseOAuthState,
	readOAuthStateCookie,
} from "#/server/oauth-cookies";
import { getServiceTokenForApp } from "#/server/repositories/paired-apps";
import { createUserSession } from "#/server/repositories/user-sessions";
import {
	clearSessionCookieHeader,
	sealHubBrowserSession,
	hubBrowserSessionCookieHeader,
} from "#/server/session";

export const Route = createFileRoute("/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code")?.trim() ?? "";
				const state = url.searchParams.get("state")?.trim() ?? "";
				const stored = readOAuthStateCookie(request);

				const headers = new Headers();
				headers.append("Set-Cookie", clearOAuthStateCookieHeader());

				if (!code || !state || !stored || state !== stored) {
					headers.set("Location", "/?error=oauth_state");
					return new Response(null, { status: 302, headers });
				}

				const parsed = parseOAuthState(state);
				if (!parsed) {
					headers.set("Location", "/?error=oauth_state");
					return new Response(null, { status: 302, headers });
				}

				try {
					const cfg = await resolveOAuthConfig();
					const accessToken = await exchangeGitHubCode(cfg, code);
					const user = await fetchGitHubUser(accessToken);

					const sessionId = createUserSession({
						githubAccessToken: accessToken,
						login: user.login,
						avatarUrl: user.avatar_url,
						name: user.name,
					});

					if (parsed.app === "hub") {
						const token = await sealHubBrowserSession({ sessionId });
						headers.append("Set-Cookie", hubBrowserSessionCookieHeader(token));
						headers.set("Location", "/profile");
						return new Response(null, { status: 302, headers });
					}

					const app = await getAppById(parsed.app);
					if (!app) {
						headers.set("Location", "/?error=unknown_app");
						return new Response(null, { status: 302, headers });
					}

					const serviceToken = getServiceTokenForApp(app.id);
					if (!serviceToken) {
						headers.set("Location", "/?error=app_not_paired");
						return new Response(null, { status: 302, headers });
					}

					const handoff = await issueHandoffToken(serviceToken, {
						app: app.id,
						sessionId,
						login: user.login,
						avatarUrl: user.avatar_url,
						name: user.name,
					});
					headers.set(
						"Location",
						buildHandoffFinishUrl(app.publicUrl, handoff),
					);
					return new Response(null, { status: 302, headers });
				} catch {
					headers.append("Set-Cookie", clearSessionCookieHeader());
					headers.set("Location", "/?error=oauth_failed");
					return new Response(null, { status: 302, headers });
				}
			},
		},
	},
	component: CallbackPage,
});

function CallbackPage() {
	throw redirect({ to: "/" });
}

import {
	buildHandoffFinishUrl,
	issueHandoffToken,
} from "@beskid/auth-client";

import {
	getAppById,
	isAdminLogin,
	isOAuthConfigured,
	resolveOAuthConfig,
} from "#/server/config-store";
import { promoteBootstrapAdminIfNeeded } from "#/server/hub-admin-bootstrap.server";
import {
	buildGitHubAuthorizeUrl,
	exchangeGitHubCode,
	fetchGitHubUser,
} from "#/server/github-oauth";
import {
	buildOAuthState,
	clearOAuthStateCookieHeader,
	oauthStateCookieHeader,
	parseOAuthState,
	readOAuthStateCookie,
} from "#/server/oauth-cookies";
import { getServiceTokenForApp } from "#/server/repositories/paired-apps";
import { createUserSession } from "#/server/repositories/user-sessions";
import {
	clearSessionCookieHeader,
	hubBrowserSessionCookieHeader,
	sealHubBrowserSession,
} from "#/server/session";

export async function handleLoginGet(
	request: Request,
): Promise<Response | undefined> {
	const url = new URL(request.url);
	const app = url.searchParams.get("app")?.trim();
	if (!app) return undefined;

	if (!(await isOAuthConfigured())) {
		return new Response(null, {
			status: 302,
			headers: { Location: "/onboarding" },
		});
	}

	if (app !== "hub") {
		const consumer = await getAppById(app);
		if (!consumer) {
			return new Response(null, {
				status: 302,
				headers: { Location: "/?error=unknown_app" },
			});
		}
	}

	const nonce = crypto.randomUUID();
	const state = buildOAuthState(nonce, app);
	const cfg = await resolveOAuthConfig();
	const headers = new Headers();
	headers.set("Location", buildGitHubAuthorizeUrl(cfg, state));
	headers.append("Set-Cookie", oauthStateCookieHeader(state));
	return new Response(null, { status: 302, headers });
}

export async function handleCallbackGet(request: Request): Promise<Response> {
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

		const bootstrapped = promoteBootstrapAdminIfNeeded(user.login);

		if (parsed.app === "hub") {
			const token = await sealHubBrowserSession({ sessionId });
			headers.append("Set-Cookie", hubBrowserSessionCookieHeader(token));
			const isAdmin = bootstrapped || (await isAdminLogin(user.login));
			headers.set("Location", isAdmin ? "/admin" : "/profile");
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
			subject: `github:${user.id}`,
		});
		headers.set("Location", buildHandoffFinishUrl(app.publicUrl, handoff));
		return new Response(null, { status: 302, headers });
	} catch {
		headers.append("Set-Cookie", clearSessionCookieHeader());
		headers.set("Location", "/?error=oauth_failed");
		return new Response(null, { status: 302, headers });
	}
}

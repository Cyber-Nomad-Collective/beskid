import { a as string, i as object } from "../_libs/zod.mjs";
import { t as SignJWT } from "../_libs/jose.mjs";
import { A as sealHubBrowserSession, E as promoteBootstrapAdminIfNeeded, b as isOAuthConfigured, f as getAppById, g as getServiceTokenForApp, k as resolveOAuthConfig, l as createUserSession, n as AUTH_HUB_ISSUER, r as HUB_USER_TOKEN_TTL_SECONDS, s as clearSessionCookieHeader, u as env, v as hubBrowserSessionCookieHeader, y as isAdminLogin } from "./pairing-D6IQx9Rj.mjs";
import { c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as fetchLoginPageContext } from "./app-server.functions-BU51zfHg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DQWvq9Pa.js
function secretKey(secret) {
	if (secret.length < 32) throw new Error("Service token must be at least 32 characters");
	return new TextEncoder().encode(secret);
}
async function issueHandoffToken(serviceToken, input) {
	const claims = {
		app: input.app,
		sid: input.sessionId,
		login: input.login,
		avatar_url: input.avatarUrl
	};
	if (input.name) claims.name = input.name;
	return new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuer(AUTH_HUB_ISSUER).setIssuedAt().setExpirationTime(`${HUB_USER_TOKEN_TTL_SECONDS}s`).sign(secretKey(serviceToken));
}
function buildHandoffFinishUrl(appPublicUrl, handoffToken) {
	return `${appPublicUrl.replace(/\/$/, "")}/api/auth/hub-finish?handoff=${encodeURIComponent(handoffToken)}`;
}
var GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
var GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
var GITHUB_USER_URL = "https://api.github.com/user";
function buildGitHubAuthorizeUrl(cfg, state) {
	const url = new URL(GITHUB_AUTHORIZE_URL);
	url.searchParams.set("client_id", cfg.clientId);
	url.searchParams.set("redirect_uri", cfg.callbackUrl);
	url.searchParams.set("scope", "read:user repo");
	url.searchParams.set("state", state);
	return url.toString();
}
async function exchangeGitHubCode(cfg, code) {
	const response = await fetch(GITHUB_TOKEN_URL, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			client_id: cfg.clientId,
			client_secret: cfg.clientSecret,
			code,
			redirect_uri: cfg.callbackUrl
		})
	});
	if (!response.ok) throw new Error(`GitHub token exchange failed (${response.status})`);
	const payload = await response.json();
	if (!payload.access_token) throw new Error(payload.error_description ?? payload.error ?? "Missing access token");
	return payload.access_token;
}
async function fetchGitHubUser(accessToken) {
	const response = await fetch(GITHUB_USER_URL, { headers: {
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${accessToken}`,
		"X-GitHub-Api-Version": "2022-11-28"
	} });
	if (!response.ok) throw new Error(`GitHub user fetch failed (${response.status})`);
	const user = await response.json();
	if (!user.login) throw new Error("Missing GitHub login");
	return user;
}
var OAUTH_STATE_COOKIE = "beskid_auth_oauth_state";
function isProduction() {
	return env.NODE_ENV === "production";
}
function oauthStateCookieHeader(state) {
	const secure = isProduction() ? "; Secure" : "";
	return `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}
function readOAuthStateCookie(request) {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === "beskid_auth_oauth_state") return decodeURIComponent(rest.join("="));
	}
	return null;
}
function clearOAuthStateCookieHeader() {
	return `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
function buildOAuthState(nonce, app) {
	return `${nonce}:${app}`;
}
function parseOAuthState(state) {
	const parts = state.split(":");
	if (parts.length < 2 || !parts[0] || !parts[1]) return null;
	return {
		nonce: parts[0],
		app: parts.slice(1).join(":")
	};
}
async function handleLoginGet(request) {
	const app = new URL(request.url).searchParams.get("app")?.trim();
	if (!app) return void 0;
	if (!await isOAuthConfigured()) return new Response(null, {
		status: 302,
		headers: { Location: "/onboarding" }
	});
	if (app !== "hub") {
		if (!await getAppById(app)) return new Response(null, {
			status: 302,
			headers: { Location: "/?error=unknown_app" }
		});
	}
	const state = buildOAuthState(crypto.randomUUID(), app);
	const cfg = await resolveOAuthConfig();
	const headers = new Headers();
	headers.set("Location", buildGitHubAuthorizeUrl(cfg, state));
	headers.append("Set-Cookie", oauthStateCookieHeader(state));
	return new Response(null, {
		status: 302,
		headers
	});
}
async function handleCallbackGet(request) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code")?.trim() ?? "";
	const state = url.searchParams.get("state")?.trim() ?? "";
	const stored = readOAuthStateCookie(request);
	const headers = new Headers();
	headers.append("Set-Cookie", clearOAuthStateCookieHeader());
	if (!code || !state || !stored || state !== stored) {
		headers.set("Location", "/?error=oauth_state");
		return new Response(null, {
			status: 302,
			headers
		});
	}
	const parsed = parseOAuthState(state);
	if (!parsed) {
		headers.set("Location", "/?error=oauth_state");
		return new Response(null, {
			status: 302,
			headers
		});
	}
	try {
		const accessToken = await exchangeGitHubCode(await resolveOAuthConfig(), code);
		const user = await fetchGitHubUser(accessToken);
		const sessionId = createUserSession({
			githubAccessToken: accessToken,
			login: user.login,
			avatarUrl: user.avatar_url,
			name: user.name
		});
		const bootstrapped = promoteBootstrapAdminIfNeeded(user.login);
		if (parsed.app === "hub") {
			const token = await sealHubBrowserSession({ sessionId });
			headers.append("Set-Cookie", hubBrowserSessionCookieHeader(token));
			const isAdmin = bootstrapped || await isAdminLogin(user.login);
			headers.set("Location", isAdmin ? "/admin" : "/profile");
			return new Response(null, {
				status: 302,
				headers
			});
		}
		const app = await getAppById(parsed.app);
		if (!app) {
			headers.set("Location", "/?error=unknown_app");
			return new Response(null, {
				status: 302,
				headers
			});
		}
		const serviceToken = getServiceTokenForApp(app.id);
		if (!serviceToken) {
			headers.set("Location", "/?error=app_not_paired");
			return new Response(null, {
				status: 302,
				headers
			});
		}
		const handoff = await issueHandoffToken(serviceToken, {
			app: app.id,
			sessionId,
			login: user.login,
			avatarUrl: user.avatar_url,
			name: user.name
		});
		headers.set("Location", buildHandoffFinishUrl(app.publicUrl, handoff));
		return new Response(null, {
			status: 302,
			headers
		});
	} catch {
		headers.append("Set-Cookie", clearSessionCookieHeader());
		headers.set("Location", "/?error=oauth_failed");
		return new Response(null, {
			status: 302,
			headers
		});
	}
}
var $$splitComponentImporter = () => import("./login-D74TDl_h.mjs");
var loginSearchSchema = object({
	app: string().optional(),
	error: string().optional()
});
var Route = createFileRoute("/login")({
	validateSearch: loginSearchSchema,
	loader: () => fetchLoginPageContext(),
	server: { handlers: { GET: ({ request }) => handleLoginGet(request) } },
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { handleCallbackGet as n, Route as t };

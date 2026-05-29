import { o as __toESM } from "../_runtime.mjs";
import { a as string, i as object, n as array, r as boolean, t as _enum } from "../_libs/zod.mjs";
import { n as jwtVerify } from "../_libs/jose.mjs";
import { C as listPairingAudit, D as readAuthConfig, M as writeAuthConfig, O as removeAdminLogin, S as listEnabledApps, _ as getSessionFromRequest, a as approvePairing, b as isOAuthConfigured, c as createPairingRequest, d as getAdminLogins, g as getServiceTokenForApp, h as getPairingRequest, i as addAdminLogin, j as verifySetupToken, k as resolveOAuthConfig, m as getPairedApp, n as AUTH_HUB_ISSUER, o as cancelPairingRequest, p as getGithubTokenForSession, s as clearSessionCookieHeader, u as env, x as isOnboarded, y as isAdminLogin } from "./pairing-D6IQx9Rj.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { T as redirect, a as createRouter, c as createFileRoute, l as createRootRoute, n as Scripts, o as Outlet, r as HeadContent, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createMiddleware } from "./ssr.mjs";
import { n as fetchAdminAccess } from "./app-server.functions-BU51zfHg.mjs";
import { t as Route$18 } from "../_requestId-CNShhdfb.mjs";
import { t as J } from "../_libs/next-themes.mjs";
import { t as Route$19 } from "./admin-Cy7RBepx.mjs";
import { n as handleCallbackGet, t as Route$20 } from "./login-DQWvq9Pa.mjs";
import { t as Route$21 } from "./onboarding-Bl0S_iO1.mjs";
import { t as Route$22 } from "./pairing-BRsMDuf7.mjs";
import { t as Route$23 } from "./profile-CEsPz1xi.mjs";
import { t as Route$24 } from "./routes-gVSjjEsO.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as require_pino } from "../_libs/pino+[...].mjs";
import { t as require_prom_client } from "../_libs/prom-client+tdigest.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BLQXG9CO.js
var import_jsx_runtime = require_jsx_runtime();
var import_pino = /* @__PURE__ */ __toESM(require_pino());
var import_prom_client = require_prom_client();
function getContext() {
	return { queryClient: new QueryClient() };
}
var PINO_LEVELS = new Set([
	"fatal",
	"error",
	"warn",
	"info",
	"debug",
	"trace",
	"silent"
]);
function resolveLogLevel() {
	const fromEnv = process.env.LOG_LEVEL;
	if (fromEnv && PINO_LEVELS.has(fromEnv.toLowerCase())) return fromEnv.toLowerCase();
	return "info";
}
function normalizeRoute(pathname) {
	if (!pathname || pathname === "/") return "/";
	const withoutQuery = pathname.split("?")[0] ?? pathname;
	if (withoutQuery.startsWith("/api/")) {
		const parts = withoutQuery.split("/").filter(Boolean);
		if (parts.length >= 3) return `/${parts.slice(0, 3).join("/")}`;
	}
	return withoutQuery.length > 80 ? `${withoutQuery.slice(0, 77)}...` : withoutQuery;
}
function createObservability(options) {
	const { service } = options;
	const registry = new import_prom_client.Registry();
	registry.setDefaultLabels({ service });
	(0, import_prom_client.collectDefaultMetrics)({ register: registry });
	const httpRequestDuration = new import_prom_client.Histogram({
		name: "http_request_duration_seconds",
		help: "HTTP request duration in seconds",
		labelNames: [
			"method",
			"route",
			"status_code"
		],
		registers: [registry],
		buckets: [
			.005,
			.01,
			.025,
			.05,
			.1,
			.25,
			.5,
			1,
			2.5,
			5,
			10
		]
	});
	const httpRequestsTotal = new import_prom_client.Counter({
		name: "http_requests_total",
		help: "Total HTTP requests",
		labelNames: [
			"method",
			"route",
			"status_code"
		],
		registers: [registry]
	});
	const logger = (0, import_pino.default)({
		level: resolveLogLevel(),
		base: { service }
	});
	const recordHttpRequest = (method, route, statusCode, durationSeconds) => {
		const labels = {
			method: method.toUpperCase(),
			route: normalizeRoute(route),
			status_code: String(statusCode)
		};
		httpRequestDuration.observe(labels, durationSeconds);
		httpRequestsTotal.inc(labels);
	};
	return {
		service,
		registry,
		logger,
		httpRequestDuration,
		httpRequestsTotal,
		renderMetrics: () => registry.metrics(),
		recordHttpRequest
	};
}
var defaultBundle;
function initObservability(options) {
	defaultBundle = createObservability(options);
	return defaultBundle;
}
function getObservability() {
	if (!defaultBundle) throw new Error("Observability not initialized — call initObservability() at server startup");
	return defaultBundle;
}
async function metricsHandler() {
	const bundle = getObservability();
	const body = await bundle.renderMetrics();
	return new Response(body, { headers: { "Content-Type": bundle.registry.contentType } });
}
initObservability({ service: "beskid-auth" });
var observabilityMiddleware = createMiddleware().server(async ({ next, request }) => {
	const url = new URL(request.url);
	if (url.pathname === "/metrics") return next();
	const start = performance.now();
	try {
		const result = await next();
		getObservability().recordHttpRequest(request.method, url.pathname, 200, (performance.now() - start) / 1e3);
		return result;
	} catch (error) {
		getObservability().recordHttpRequest(request.method, url.pathname, 500, (performance.now() - start) / 1e3);
		throw error;
	}
});
function ThemeProvider$1({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(J, {
		attribute: "data-theme",
		defaultTheme: "system",
		enableSystem: true,
		disableTransitionOnChange: true,
		children
	});
}
var styles_default = "/assets/styles-ti9cf6Ss.css";
var Route$17 = createRootRoute({
	server: { middleware: [observabilityMiddleware] },
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Beskid Auth" }
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	component: RootComponent,
	shellComponent: RootDocument
});
function RootComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider$1, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) });
}
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
initObservability({ service: "beskid-auth" });
var Route$16 = createFileRoute("/metrics")({ server: { handlers: { GET: () => metricsHandler() } } });
var $$splitComponentImporter$1 = () => import("./callback-h6HRBQxf.mjs");
var Route$15 = createFileRoute("/callback")({
	server: { handlers: { GET: ({ request }) => handleCallbackGet(request) } },
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var Route$14 = createFileRoute("/account")({ beforeLoad: () => {
	throw redirect({ to: "/profile" });
} });
var Route$13 = createFileRoute("/api/v1/me")({ server: { handlers: { GET: async ({ request }) => {
	const session = await getSessionFromRequest(request);
	if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
	const isAdmin = await isAdminLogin(session.login);
	return Response.json({
		user: {
			login: session.login,
			name: session.name,
			avatarUrl: session.avatarUrl
		},
		isAdmin
	});
} } } });
var Route$12 = createFileRoute("/api/v1/health")({ server: { handlers: { GET: async () => Response.json({
	ok: true,
	version: "v1"
}) } } });
var Route$11 = createFileRoute("/api/v1/apps")({ server: { handlers: { GET: async () => {
	const apps = await listEnabledApps();
	return Response.json({ apps });
} } } });
var Route$10 = createFileRoute("/api/auth/logout")({ server: { handlers: {
	POST: async () => {
		const headers = new Headers();
		headers.append("Set-Cookie", clearSessionCookieHeader());
		headers.set("Location", "/");
		return new Response(null, {
			status: 302,
			headers
		});
	},
	GET: async () => {
		const headers = new Headers();
		headers.append("Set-Cookie", clearSessionCookieHeader());
		headers.set("Location", "/");
		return new Response(null, {
			status: 302,
			headers
		});
	}
} } });
var $$splitComponentImporter = () => import("./new-CHCavJhb.mjs");
var Route$9 = createFileRoute("/admin/pairing/new")({
	loader: async () => {
		const access = await fetchAdminAccess();
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") throw redirect({
			to: "/login",
			search: { app: "hub" }
		});
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		return null;
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var Route$8 = createFileRoute("/api/v1/pairing/status")({ server: { handlers: { GET: async ({ request }) => {
	const appId = new URL(request.url).searchParams.get("appId") ?? "";
	const parsed = _enum([
		"tracker",
		"nexus",
		"pckg"
	]).safeParse(appId);
	if (!parsed.success) return Response.json({ error: "Invalid appId" }, { status: 400 });
	const row = getPairedApp(parsed.data);
	return Response.json({
		appId: parsed.data,
		paired: row !== null,
		publicUrl: row?.public_url
	});
} } } });
async function requireHubAdmin(request) {
	const session = await getSessionFromRequest(request);
	if (!session) return null;
	if (!await isAdminLogin(session.login)) return null;
	return session;
}
var bodySchema$1 = object({
	appId: _enum([
		"tracker",
		"nexus",
		"pckg"
	]),
	publicUrl: string().url()
});
var Route$7 = createFileRoute("/api/v1/pairing/requests")({ server: { handlers: { POST: async ({ request }) => {
	const admin = await requireHubAdmin(request);
	if (!admin) return Response.json({ error: "Hub admin required" }, { status: 401 });
	let json;
	try {
		json = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}
	const parsed = bodySchema$1.safeParse(json);
	if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
	const result = createPairingRequest({
		appId: parsed.data.appId,
		publicUrl: parsed.data.publicUrl,
		createdByLogin: admin.login
	});
	return Response.json(result);
} } } });
var bodySchema = object({
	code: string().min(4),
	appId: _enum([
		"tracker",
		"nexus",
		"pckg"
	]),
	publicUrl: string().url(),
	approverLogin: string().min(1),
	approvalNonce: string().optional()
});
var Route$6 = createFileRoute("/api/v1/pairing/approve")({ server: { handlers: { POST: async ({ request }) => {
	let json;
	try {
		json = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
	const result = approvePairing({
		code: parsed.data.code,
		appId: parsed.data.appId,
		publicUrl: parsed.data.publicUrl,
		approverLogin: parsed.data.approverLogin
	});
	if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
	return Response.json({ serviceToken: result.serviceToken });
} } } });
/** OpenAPI 3.1 document served at GET /api/v1/openapi.json */
var openApiV1Document = {
	openapi: "3.1.0",
	info: {
		title: "Beskid Auth Hub API",
		version: "1.0.0",
		description: "Versioned HTTP API for the Beskid auth hub. Browser OAuth uses /login and /callback."
	},
	servers: [{
		url: "/api/v1",
		description: "Current host"
	}],
	paths: {
		"/health": { get: {
			operationId: "getHealth",
			summary: "Liveness probe",
			responses: { "200": {
				description: "OK",
				content: { "application/json": { schema: {
					type: "object",
					required: ["ok", "version"],
					properties: {
						ok: {
							type: "boolean",
							const: true
						},
						version: {
							type: "string",
							example: "v1"
						}
					}
				} } }
			} }
		} },
		"/me": { get: {
			operationId: "getMe",
			summary: "Current hub session",
			responses: {
				"200": { description: "Authenticated" },
				"401": { description: "Not signed in" }
			}
		} },
		"/apps": { get: {
			operationId: "listApps",
			summary: "Registered consumer apps",
			responses: { "200": { description: "App list" } }
		} },
		"/admin/status": { get: {
			operationId: "getAdminStatus",
			summary: "Onboarding status",
			responses: { "200": { description: "Status" } }
		} },
		"/admin/setup": { post: {
			operationId: "postAdminSetup",
			summary: "First-run onboarding",
			responses: {
				"200": { description: "Saved" },
				"400": { description: "Invalid" },
				"403": { description: "Forbidden" }
			}
		} }
	}
};
var Route$5 = createFileRoute("/api/v1/openapi/json")({ server: { handlers: { GET: async () => Response.json(openApiV1Document) } } });
var GITHUB_API = "https://api.github.com";
var BLOCKED_REQUEST_HEADERS = new Set([
	"host",
	"connection",
	"content-length",
	"authorization",
	"cookie",
	"transfer-encoding"
]);
var BLOCKED_RESPONSE_HEADERS = new Set([
	"transfer-encoding",
	"connection",
	"content-encoding"
]);
function serviceKey(secret) {
	return new TextEncoder().encode(secret);
}
async function resolveHubUserSession(hubUserToken) {
	let appId;
	let sessionId;
	try {
		const unverified = JSON.parse(Buffer.from(hubUserToken.split(".")[1] ?? "", "base64url").toString("utf8"));
		appId = unverified.app;
		sessionId = unverified.sid;
	} catch {
		return null;
	}
	if (!appId || !sessionId) return null;
	const serviceToken = getServiceTokenForApp(appId);
	if (!serviceToken) return null;
	try {
		const { payload } = await jwtVerify(hubUserToken, serviceKey(serviceToken), {
			issuer: AUTH_HUB_ISSUER,
			algorithms: ["HS256"]
		});
		if (typeof payload.app !== "string" || typeof payload.sid !== "string") return null;
		return {
			appId: payload.app,
			sessionId: payload.sid
		};
	} catch {
		return null;
	}
}
async function proxyGitHubApi(incoming, githubPath) {
	const authHeader = incoming.headers.get("authorization") ?? "";
	const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
	if (!match) return Response.json({ error: "Missing hub user token" }, { status: 401 });
	const resolved = await resolveHubUserSession(match[1]);
	if (!resolved) return Response.json({ error: "Invalid hub user token" }, { status: 401 });
	const githubToken = getGithubTokenForSession(resolved.sessionId);
	if (!githubToken) return Response.json({ error: "Session expired" }, { status: 401 });
	const path = githubPath.replace(/^\//, "");
	const target = new URL(path, `${GITHUB_API}/`);
	new URL(incoming.url).searchParams.forEach((value, key) => {
		target.searchParams.set(key, value);
	});
	const forwardHeaders = new Headers();
	for (const [key, value] of incoming.headers) {
		const lower = key.toLowerCase();
		if (BLOCKED_REQUEST_HEADERS.has(lower)) continue;
		forwardHeaders.append(key, value);
	}
	forwardHeaders.set("Authorization", `Bearer ${githubToken}`);
	forwardHeaders.set("Accept", forwardHeaders.get("Accept") ?? "application/vnd.github+json");
	forwardHeaders.set("X-GitHub-Api-Version", "2022-11-28");
	forwardHeaders.set("User-Agent", "beskid-auth-hub-github-proxy");
	const body = incoming.method === "GET" || incoming.method === "HEAD" ? void 0 : await incoming.arrayBuffer();
	const githubResponse = await fetch(target.toString(), {
		method: incoming.method,
		headers: forwardHeaders,
		body,
		redirect: "manual"
	});
	const outHeaders = new Headers();
	for (const [key, value] of githubResponse.headers) {
		if (BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) continue;
		outHeaders.append(key, value);
	}
	return new Response(githubResponse.body, {
		status: githubResponse.status,
		statusText: githubResponse.statusText,
		headers: outHeaders
	});
}
var Route$4 = createFileRoute("/api/v1/github/$")({ server: { handlers: {
	GET: ({ request, params }) => proxyGitHubApi(request, params._splat ?? ""),
	POST: ({ request, params }) => proxyGitHubApi(request, params._splat ?? ""),
	PATCH: ({ request, params }) => proxyGitHubApi(request, params._splat ?? ""),
	PUT: ({ request, params }) => proxyGitHubApi(request, params._splat ?? ""),
	DELETE: ({ request, params }) => proxyGitHubApi(request, params._splat ?? "")
} } });
var Route$3 = createFileRoute("/api/v1/admin/status")({ server: { handlers: { GET: async () => {
	const [oauth, apps, onboarded] = await Promise.all([
		resolveOAuthConfig(),
		listEnabledApps(),
		isOnboarded()
	]);
	return Response.json({
		onboarded,
		oauthConfigured: await isOAuthConfigured(),
		oauthSource: oauth.source,
		hasSessionSecret: env.SESSION_SECRET.length >= 32,
		hasSetupToken: Boolean(env.AUTH_SETUP_TOKEN?.trim()),
		appCount: apps.length
	});
} } } });
var setupSchema = object({
	setupToken: string().optional(),
	githubClientId: string().min(1),
	githubClientSecret: string().min(1),
	githubOAuthCallbackUrl: string().url(),
	adminGitHubLogins: array(string().min(1)).min(0),
	apps: array(object({
		id: _enum([
			"tracker",
			"nexus",
			"pckg"
		]),
		publicUrl: string().url(),
		enabled: boolean().optional()
	})).optional().default([])
});
var Route$2 = createFileRoute("/api/v1/admin/setup")({ server: { handlers: { POST: async ({ request }) => {
	const onboarded = await isOnboarded();
	let json;
	try {
		json = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}
	const setupToken = (typeof json === "object" && json && "setupToken" in json && typeof json.setupToken === "string" ? json.setupToken : void 0) ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? void 0;
	if ((onboarded || Boolean(env.AUTH_SETUP_TOKEN?.trim())) && !verifySetupToken(setupToken)) return Response.json({ error: "Invalid setup token" }, { status: 403 });
	const parsed = setupSchema.safeParse(json);
	if (!parsed.success) return Response.json({ error: "Invalid setup payload" }, { status: 400 });
	const existing = await readAuthConfig();
	const incomingAdmins = parsed.data.adminGitHubLogins.map((s) => s.trim().toLowerCase());
	const adminGitHubLogins = incomingAdmins.length > 0 ? [...new Set([...existing.adminGitHubLogins, ...incomingAdmins])] : existing.adminGitHubLogins;
	await writeAuthConfig({
		onboarded: true,
		githubClientId: parsed.data.githubClientId,
		githubClientSecret: parsed.data.githubClientSecret,
		githubOAuthCallbackUrl: parsed.data.githubOAuthCallbackUrl,
		adminGitHubLogins,
		apps: []
	});
	return Response.json({ ok: true });
} } } });
var githubLoginSchema = string().min(1).max(39).regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/, "Invalid GitHub login");
var addBodySchema = object({ login: githubLoginSchema });
var removeQuerySchema = object({ login: githubLoginSchema });
var Route$1 = createFileRoute("/api/v1/admin/admins")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!await requireHubAdmin(request)) return Response.json({ error: "Hub admin required" }, { status: 401 });
		return Response.json({ admins: getAdminLogins() });
	},
	POST: async ({ request }) => {
		if (!await requireHubAdmin(request)) return Response.json({ error: "Hub admin required" }, { status: 401 });
		let json;
		try {
			json = await request.json();
		} catch {
			return Response.json({ error: "Invalid JSON" }, { status: 400 });
		}
		const parsed = addBodySchema.safeParse(json);
		if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
		const admins = addAdminLogin(parsed.data.login);
		return Response.json({ admins });
	},
	DELETE: async ({ request }) => {
		if (!await requireHubAdmin(request)) return Response.json({ error: "Hub admin required" }, { status: 401 });
		const url = new URL(request.url);
		const parsed = removeQuerySchema.safeParse({ login: url.searchParams.get("login") ?? "" });
		if (!parsed.success) return Response.json({ error: "Invalid login" }, { status: 400 });
		const target = parsed.data.login.trim().toLowerCase();
		const current = getAdminLogins();
		if (current.length <= 1 && current.includes(target)) return Response.json({ error: "Cannot remove the last hub admin" }, { status: 400 });
		const admins = removeAdminLogin(target);
		return Response.json({ admins });
	}
} } });
var Route = createFileRoute("/api/v1/pairing/requests/$requestId")({ server: { handlers: {
	GET: async ({ request, params }) => {
		if (!await requireHubAdmin(request)) return Response.json({ error: "Hub admin required" }, { status: 401 });
		const row = getPairingRequest(params.requestId);
		if (!row) return Response.json({ error: "Not found" }, { status: 404 });
		return Response.json({
			request: row,
			audit: listPairingAudit(row.id),
			approveUrlTemplate: `${row.public_url.replace(/\/$/, "")}/settings/auth/pair?code=<code>`
		});
	},
	DELETE: async ({ request, params }) => {
		const admin = await requireHubAdmin(request);
		if (!admin) return Response.json({ error: "Hub admin required" }, { status: 401 });
		const result = cancelPairingRequest(params.requestId, admin.login);
		if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
		return Response.json({ ok: true });
	}
} } });
var ProfileRoute = Route$23.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$17
});
var OnboardingRoute = Route$21.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => Route$17
});
var MetricsRoute = Route$16.update({
	id: "/metrics",
	path: "/metrics",
	getParentRoute: () => Route$17
});
var LoginRoute = Route$20.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$17
});
var CallbackRoute = Route$15.update({
	id: "/callback",
	path: "/callback",
	getParentRoute: () => Route$17
});
var AccountRoute = Route$14.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => Route$17
});
var IndexRoute = Route$24.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$17
});
var AdminIndexRoute = Route$19.update({
	id: "/admin/",
	path: "/admin/",
	getParentRoute: () => Route$17
});
var AdminPairingIndexRoute = Route$22.update({
	id: "/admin/pairing/",
	path: "/admin/pairing/",
	getParentRoute: () => Route$17
});
var ApiV1MeRoute = Route$13.update({
	id: "/api/v1/me",
	path: "/api/v1/me",
	getParentRoute: () => Route$17
});
var ApiV1HealthRoute = Route$12.update({
	id: "/api/v1/health",
	path: "/api/v1/health",
	getParentRoute: () => Route$17
});
var ApiV1AppsRoute = Route$11.update({
	id: "/api/v1/apps",
	path: "/api/v1/apps",
	getParentRoute: () => Route$17
});
var ApiAuthLogoutRoute = Route$10.update({
	id: "/api/auth/logout",
	path: "/api/auth/logout",
	getParentRoute: () => Route$17
});
var AdminPairingNewRoute = Route$9.update({
	id: "/admin/pairing/new",
	path: "/admin/pairing/new",
	getParentRoute: () => Route$17
});
var AdminPairingRequestIdRoute = Route$18.update({
	id: "/admin/pairing/$requestId",
	path: "/admin/pairing/$requestId",
	getParentRoute: () => Route$17
});
var ApiV1PairingStatusRoute = Route$8.update({
	id: "/api/v1/pairing/status",
	path: "/api/v1/pairing/status",
	getParentRoute: () => Route$17
});
var ApiV1PairingRequestsRoute = Route$7.update({
	id: "/api/v1/pairing/requests",
	path: "/api/v1/pairing/requests",
	getParentRoute: () => Route$17
});
var ApiV1PairingApproveRoute = Route$6.update({
	id: "/api/v1/pairing/approve",
	path: "/api/v1/pairing/approve",
	getParentRoute: () => Route$17
});
var ApiV1OpenapiJsonRoute = Route$5.update({
	id: "/api/v1/openapi/json",
	path: "/api/v1/openapi/json",
	getParentRoute: () => Route$17
});
var ApiV1GithubSplatRoute = Route$4.update({
	id: "/api/v1/github/$",
	path: "/api/v1/github/$",
	getParentRoute: () => Route$17
});
var ApiV1AdminStatusRoute = Route$3.update({
	id: "/api/v1/admin/status",
	path: "/api/v1/admin/status",
	getParentRoute: () => Route$17
});
var ApiV1AdminSetupRoute = Route$2.update({
	id: "/api/v1/admin/setup",
	path: "/api/v1/admin/setup",
	getParentRoute: () => Route$17
});
var ApiV1AdminAdminsRoute = Route$1.update({
	id: "/api/v1/admin/admins",
	path: "/api/v1/admin/admins",
	getParentRoute: () => Route$17
});
var ApiV1PairingRequestsRouteChildren = { ApiV1PairingRequestsRequestIdRoute: Route.update({
	id: "/$requestId",
	path: "/$requestId",
	getParentRoute: () => ApiV1PairingRequestsRoute
}) };
var rootRouteChildren = {
	IndexRoute,
	AccountRoute,
	CallbackRoute,
	LoginRoute,
	MetricsRoute,
	OnboardingRoute,
	ProfileRoute,
	AdminIndexRoute,
	AdminPairingRequestIdRoute,
	AdminPairingNewRoute,
	ApiAuthLogoutRoute,
	ApiV1AppsRoute,
	ApiV1HealthRoute,
	ApiV1MeRoute,
	AdminPairingIndexRoute,
	ApiV1AdminAdminsRoute,
	ApiV1AdminSetupRoute,
	ApiV1AdminStatusRoute,
	ApiV1GithubSplatRoute,
	ApiV1OpenapiJsonRoute,
	ApiV1PairingApproveRoute,
	ApiV1PairingRequestsRoute: ApiV1PairingRequestsRoute._addFileChildren(ApiV1PairingRequestsRouteChildren),
	ApiV1PairingStatusRoute
};
var routeTree = Route$17._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		context: getContext(),
		scrollRestoration: true
	});
}
//#endregion
export { getRouter };

import { a as string, t as _enum } from "../_libs/zod.mjs";
import { n as jwtVerify, t as SignJWT } from "../_libs/jose.mjs";
import { t as createEnv } from "../_libs/t3-oss__env-core.mjs";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import { Database } from "bun:sqlite";
//#region node_modules/.nitro/vite/services/ssr/assets/pairing-C0O8oKd7.js
var AUTH_HUB_ISSUER = "beskid-auth-hub";
var HUB_USER_TOKEN_TTL_SECONDS = 10080 * 60;
var AUTH_APP_META = {
	tracker: {
		label: "Beskid Tracker",
		description: "Kanban and platform-spec docs on GitHub issues."
	},
	nexus: {
		label: "Beskid Nexus",
		description: "Compiler graph explorer and catalog."
	},
	pckg: {
		label: "pckg registry",
		description: "Package registry accounts and publishing."
	}
};
var env = createEnv({
	server: {
		AUTH_HUB_PUBLIC_URL: string().url(),
		AUTH_HUB_SECRET: string().min(32).optional(),
		SESSION_SECRET: string().min(32),
		GITHUB_CLIENT_ID: string().min(1).optional(),
		GITHUB_CLIENT_SECRET: string().min(1).optional(),
		GITHUB_OAUTH_CALLBACK_URL: string().url().optional(),
		AUTH_SETUP_TOKEN: string().min(8).optional(),
		AUTH_DATA_DIR: string().min(1).optional(),
		TRACKER_PUBLIC_URL: string().url().optional(),
		NEXUS_PUBLIC_URL: string().url().optional(),
		PCKG_PUBLIC_URL: string().url().optional(),
		NODE_ENV: _enum([
			"development",
			"production",
			"test"
		]).optional()
	},
	runtimeEnv: {
		AUTH_HUB_PUBLIC_URL: process.env.AUTH_HUB_PUBLIC_URL,
		AUTH_HUB_SECRET: process.env.AUTH_HUB_SECRET,
		SESSION_SECRET: process.env.SESSION_SECRET,
		GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
		GITHUB_OAUTH_CALLBACK_URL: process.env.GITHUB_OAUTH_CALLBACK_URL,
		AUTH_SETUP_TOKEN: process.env.AUTH_SETUP_TOKEN,
		AUTH_DATA_DIR: process.env.AUTH_DATA_DIR,
		TRACKER_PUBLIC_URL: process.env.TRACKER_PUBLIC_URL,
		NEXUS_PUBLIC_URL: process.env.NEXUS_PUBLIC_URL,
		PCKG_PUBLIC_URL: process.env.PCKG_PUBLIC_URL,
		NODE_ENV: "production"
	},
	emptyStringAsUndefined: true,
	skipValidation: process.env.SKIP_ENV_VALIDATION === "1" || false
});
function authDataDir() {
	return env.AUTH_DATA_DIR?.trim() || path.join(process.cwd(), "data/runtime");
}
function authDbPath() {
	return path.join(authDataDir(), "auth.sqlite");
}
function legacyConfigPath() {
	return path.join(authDataDir(), "auth-config.json");
}
function migrateAuthSchema(db) {
	db.run(`
		CREATE TABLE IF NOT EXISTS schema_meta (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);
	const versionRow = db.query("SELECT value FROM schema_meta WHERE key = 'version'").get();
	const current = versionRow ? Number.parseInt(versionRow.value, 10) : 0;
	if (current < 1) {
		applyV1(db);
		db.run("INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '1')");
	}
	if (current < 2) {
		applyV2(db);
		db.run("INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '2')");
	}
}
function applyV2(db) {
	db.run(`
		CREATE TABLE IF NOT EXISTS user_sessions (
			id TEXT PRIMARY KEY,
			github_token_encrypted TEXT NOT NULL,
			login TEXT NOT NULL,
			avatar_url TEXT NOT NULL,
			name TEXT,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
			ON user_sessions(expires_at);
	`);
	if (!db.query("PRAGMA table_info(paired_apps)").all().some((c) => c.name === "service_token_hash")) db.run("ALTER TABLE paired_apps ADD COLUMN service_token_hash TEXT");
}
function applyV1(db) {
	db.run(`
		CREATE TABLE IF NOT EXISTS hub_settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS paired_apps (
			id TEXT PRIMARY KEY,
			public_url TEXT NOT NULL,
			handoff_secret_hash TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			paired_at TEXT NOT NULL DEFAULT (datetime('now')),
			approved_by_login TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS pairing_requests (
			id TEXT PRIMARY KEY,
			app_id TEXT NOT NULL,
			public_url TEXT NOT NULL,
			code_hash TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			created_by_login TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS pairing_audit (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			request_id TEXT NOT NULL,
			event TEXT NOT NULL,
			actor_login TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (request_id) REFERENCES pairing_requests(id)
		);

		CREATE INDEX IF NOT EXISTS idx_pairing_requests_status
			ON pairing_requests(status);
	`);
}
var ALGO = "aes-256-gcm";
var IV_LEN = 12;
function masterKey() {
	const raw = env.SESSION_SECRET?.trim() || "";
	if (raw.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
	return scryptSync(raw, "beskid-auth-hub", 32);
}
function encryptSecret(plaintext) {
	const key = masterKey();
	const iv = randomBytes(IV_LEN);
	const cipher = createCipheriv(ALGO, key, iv);
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([
		iv,
		tag,
		encrypted
	]).toString("base64url");
}
function decryptSecret(payload) {
	const key = masterKey();
	const buf = Buffer.from(payload, "base64url");
	const iv = buf.subarray(0, IV_LEN);
	const tag = buf.subarray(IV_LEN, 28);
	const data = buf.subarray(28);
	const decipher = createDecipheriv(ALGO, key, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
function hashSecret(plaintext) {
	return scryptSync(plaintext, "beskid-handoff", 32).toString("base64url");
}
function hashPairingCode(code, requestId) {
	return scryptSync(code, `pairing:${requestId}`, 32).toString("base64url");
}
function randomToken(bytes = 32) {
	return randomBytes(bytes).toString("base64url");
}
function pairingCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const codeLength = 8;
	const alphabetLength = 32;
	let out = "";
	const maxUnbiasedByte = 256 - 256 % alphabetLength;
	while (out.length < codeLength) {
		const bytes = randomBytes(codeLength);
		for (const value of bytes) {
			if (value >= maxUnbiasedByte) continue;
			out += alphabet[value % alphabetLength];
			if (out.length === codeLength) break;
		}
	}
	return out;
}
var dbInstance = null;
var legacyImported = false;
function getAuthDatabase() {
	if (!dbInstance) {
		mkdirSync(authDataDir(), { recursive: true });
		dbInstance = new Database(authDbPath(), { create: true });
		migrateAuthSchema(dbInstance);
	}
	return dbInstance;
}
async function ensureLegacyConfigImported() {
	if (legacyImported) return;
	legacyImported = true;
	const db = getAuthDatabase();
	if (db.query("SELECT value FROM hub_settings WHERE key = 'onboarded'").get()?.value === "true") return;
	let file = null;
	try {
		const raw = await fs.readFile(legacyConfigPath(), "utf8");
		file = JSON.parse(raw);
	} catch {
		return;
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const set = db.prepare("INSERT OR REPLACE INTO hub_settings (key, value, updated_at) VALUES (?, ?, ?)");
	if (file.onboarded) set.run("onboarded", "true", now);
	if (file.githubClientId) set.run("github_client_id", file.githubClientId, now);
	if (file.githubClientSecret) try {
		set.run("github_client_secret", encryptSecret(file.githubClientSecret), now);
	} catch {
		set.run("github_client_secret", file.githubClientSecret, now);
	}
	if (file.githubOAuthCallbackUrl) set.run("github_oauth_callback_url", file.githubOAuthCallbackUrl, now);
	if (file.adminGitHubLogins.length > 0) set.run("admin_github_logins", JSON.stringify(file.adminGitHubLogins), now);
	for (const app of file.apps) {
		if (!app.enabled) continue;
		const legacySecret = process.env.AUTH_HUB_SECRET?.trim();
		if (!legacySecret || legacySecret.length < 32) continue;
		db.prepare(`INSERT OR REPLACE INTO paired_apps
			 (id, public_url, handoff_secret_hash, status, paired_at, approved_by_login)
			 VALUES (?, ?, ?, 'active', ?, 'legacy-import')`).run(app.id, app.publicUrl.replace(/\/$/, ""), hashSecret(legacySecret), now);
	}
}
function getHubSetting(key) {
	return getAuthDatabase().query("SELECT value FROM hub_settings WHERE key = ?").get(key)?.value ?? null;
}
function setHubSetting(key, value) {
	getAuthDatabase().prepare("INSERT OR REPLACE INTO hub_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))").run(key, value);
}
function getEncryptedHubSetting(key) {
	const stored = getHubSetting(key);
	if (!stored) return null;
	try {
		return decryptSecret(stored);
	} catch {
		return stored;
	}
}
function setEncryptedHubSetting(key, plaintext) {
	setHubSetting(key, encryptSecret(plaintext));
}
function upsertPairedApp(input) {
	const db = getAuthDatabase();
	const tokenHash = hashSecret(input.serviceToken);
	db.prepare(`INSERT OR REPLACE INTO paired_apps
		 (id, public_url, handoff_secret_hash, service_token_hash, status, paired_at, approved_by_login)
		 VALUES (?, ?, ?, ?, 'active', datetime('now'), ?)`).run(input.id, input.publicUrl.replace(/\/$/, ""), tokenHash, tokenHash, input.approvedByLogin);
	setEncryptedHubSetting(`service_token:${input.id}`, input.serviceToken);
}
function getPairedApp(appId) {
	return getAuthDatabase().query("SELECT * FROM paired_apps WHERE id = ? AND status = 'active'").get(appId) ?? null;
}
function listActivePairedApps() {
	return getAuthDatabase().query("SELECT * FROM paired_apps WHERE status = 'active' ORDER BY id").all();
}
async function listEnabledApps() {
	const hubBase = env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");
	return listActivePairedApps().map((row) => ({
		id: row.id,
		label: AUTH_APP_META[row.id].label,
		description: AUTH_APP_META[row.id].description,
		publicUrl: row.public_url,
		finishUrl: `${row.public_url}/api/auth/hub-finish`,
		loginUrl: `${hubBase}/login?app=${row.id}`
	}));
}
function getServiceTokenForApp(appId) {
	const fromDb = getEncryptedHubSetting(`service_token:${appId}`);
	if (fromDb && fromDb.length >= 32) return fromDb;
	if (!getPairedApp(appId)) return null;
	const legacy = env.AUTH_HUB_SECRET?.trim();
	return legacy && legacy.length >= 32 ? legacy : null;
}
async function ensureDb() {
	await ensureLegacyConfigImported();
}
async function readAuthConfig() {
	await ensureDb();
	const adminRaw = getHubSetting("admin_github_logins");
	return {
		onboarded: getHubSetting("onboarded") === "true",
		githubClientId: getHubSetting("github_client_id") ?? void 0,
		githubClientSecret: getEncryptedHubSetting("github_client_secret") ?? void 0,
		githubOAuthCallbackUrl: getHubSetting("github_oauth_callback_url") ?? void 0,
		adminGitHubLogins: adminRaw ? JSON.parse(adminRaw) : [],
		apps: []
	};
}
async function writeAuthConfig(config) {
	await ensureDb();
	setHubSetting("onboarded", config.onboarded ? "true" : "false");
	if (config.githubClientId) setHubSetting("github_client_id", config.githubClientId);
	if (config.githubClientSecret) setEncryptedHubSetting("github_client_secret", config.githubClientSecret);
	if (config.githubOAuthCallbackUrl) setHubSetting("github_oauth_callback_url", config.githubOAuthCallbackUrl);
	if (config.adminGitHubLogins.length > 0) setHubSetting("admin_github_logins", JSON.stringify(config.adminGitHubLogins.map((entry) => entry.trim().toLowerCase())));
}
async function resolveOAuthConfig() {
	await ensureDb();
	const clientId = env.GITHUB_CLIENT_ID?.trim() || getHubSetting("github_client_id")?.trim() || "";
	const clientSecret = env.GITHUB_CLIENT_SECRET?.trim() || getEncryptedHubSetting("github_client_secret")?.trim() || "";
	const callbackUrl = env.GITHUB_OAUTH_CALLBACK_URL?.trim() || getHubSetting("github_oauth_callback_url")?.trim() || `${env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "")}/callback`;
	let source = "none";
	if (clientId && clientSecret && callbackUrl) source = env.GITHUB_CLIENT_ID?.trim() ? "env" : "db";
	return {
		clientId,
		clientSecret,
		callbackUrl,
		source
	};
}
async function isOAuthConfigured() {
	const cfg = await resolveOAuthConfig();
	return Boolean(cfg.clientId && cfg.clientSecret && cfg.callbackUrl);
}
async function isOnboarded() {
	await ensureDb();
	if (getHubSetting("onboarded") === "true") return true;
	return isOAuthConfigured();
}
async function getAppById(appId) {
	return (await listEnabledApps()).find((app) => app.id === appId) ?? null;
}
async function isAdminLogin(login) {
	await ensureDb();
	const adminRaw = getHubSetting("admin_github_logins");
	if (!adminRaw) return false;
	const logins = JSON.parse(adminRaw);
	const normalized = login.trim().toLowerCase();
	return logins.some((entry) => entry.trim().toLowerCase() === normalized);
}
function verifySetupToken(token) {
	const expected = env.AUTH_SETUP_TOKEN?.trim();
	if (!expected) return false;
	return token === expected;
}
var ADMIN_SETTING_KEY = "admin_github_logins";
function normalizeLogin(login) {
	return login.trim().toLowerCase();
}
function getAdminLogins() {
	const adminRaw = getHubSetting(ADMIN_SETTING_KEY);
	if (!adminRaw) return [];
	try {
		const parsed = JSON.parse(adminRaw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((entry) => typeof entry === "string").map(normalizeLogin).filter(Boolean);
	} catch {
		return [];
	}
}
function persistAdminLogins(logins) {
	const normalized = [...new Set(logins.map(normalizeLogin).filter(Boolean))];
	setHubSetting(ADMIN_SETTING_KEY, JSON.stringify(normalized));
}
function promoteBootstrapAdminIfNeeded(login) {
	const normalized = normalizeLogin(login);
	if (!normalized) return false;
	if (getAdminLogins().length > 0) return false;
	persistAdminLogins([normalized]);
	return true;
}
function addAdminLogin(login) {
	const normalized = normalizeLogin(login);
	if (!normalized) return getAdminLogins();
	const logins = getAdminLogins();
	if (logins.includes(normalized)) return logins;
	persistAdminLogins([...logins, normalized]);
	return getAdminLogins();
}
function removeAdminLogin(login) {
	const normalized = normalizeLogin(login);
	if (!normalized) return getAdminLogins();
	persistAdminLogins(getAdminLogins().filter((entry) => entry !== normalized));
	return getAdminLogins();
}
var SESSION_TTL_MS = 10080 * 60 * 1e3;
function createUserSession(input) {
	const id = randomToken(16);
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
	getAuthDatabase().prepare(`INSERT INTO user_sessions
			 (id, github_token_encrypted, login, avatar_url, name, expires_at)
			 VALUES (?, ?, ?, ?, ?, ?)`).run(id, encryptSecret(input.githubAccessToken), input.login, input.avatarUrl, input.name, expiresAt);
	return id;
}
function getUserSession(sessionId) {
	const row = getAuthDatabase().query("SELECT * FROM user_sessions WHERE id = ?").get(sessionId) ?? null;
	if (!row) return null;
	if (new Date(row.expires_at).getTime() < Date.now()) {
		deleteUserSession(sessionId);
		return null;
	}
	return row;
}
function getGithubTokenForSession(sessionId) {
	const row = getUserSession(sessionId);
	if (!row) return null;
	try {
		return decryptSecret(row.github_token_encrypted);
	} catch {
		return null;
	}
}
function deleteUserSession(sessionId) {
	getAuthDatabase().prepare("DELETE FROM user_sessions WHERE id = ?").run(sessionId);
}
var SESSION_COOKIE_NAME = "beskid_auth_session";
function sessionSecret() {
	return new TextEncoder().encode(env.SESSION_SECRET);
}
async function sealHubBrowserSession(payload) {
	return new SignJWT({ sid: payload.sessionId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(sessionSecret());
}
async function unsealHubBrowserSession(token) {
	try {
		const { payload } = await jwtVerify(token, sessionSecret());
		if (typeof payload.sid !== "string") return null;
		return { sessionId: payload.sid };
	} catch {
		return null;
	}
}
async function getSessionFromRequest(request) {
	const token = readSessionCookie(request);
	if (!token) return null;
	const browser = await unsealHubBrowserSession(token);
	if (!browser) return null;
	const row = getUserSession(browser.sessionId);
	if (!row) return null;
	return {
		sessionId: row.id,
		login: row.login,
		avatarUrl: row.avatar_url,
		name: row.name
	};
}
function readSessionCookie(request) {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === "beskid_auth_session") return decodeURIComponent(rest.join("="));
	}
	return null;
}
function hubBrowserSessionCookieHeader(token, maxAgeSeconds = 3600 * 24 * 7) {
	const secure = env.NODE_ENV === "production" ? "; Secure" : "";
	return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}
function clearSessionCookieHeader() {
	return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
var PAIRING_TTL_MS = 1440 * 60 * 1e3;
function audit(requestId, event, actorLogin) {
	getAuthDatabase().prepare("INSERT INTO pairing_audit (request_id, event, actor_login) VALUES (?, ?, ?)").run(requestId, event, actorLogin);
}
function createPairingRequest(input) {
	const db = getAuthDatabase();
	const requestId = randomToken(16);
	const code = pairingCode();
	const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString();
	const publicUrl = input.publicUrl.replace(/\/$/, "");
	db.prepare(`INSERT INTO pairing_requests
		 (id, app_id, public_url, code_hash, expires_at, created_by_login, status)
		 VALUES (?, ?, ?, ?, ?, ?, 'pending')`).run(requestId, input.appId, publicUrl, hashPairingCode(code, requestId), expiresAt, input.createdByLogin);
	audit(requestId, "created", input.createdByLogin);
	env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");
	return {
		requestId,
		pairingCode: code,
		expiresAt,
		approveUrlTemplate: `${publicUrl}/settings/auth/pair?code=${encodeURIComponent(code)}`
	};
}
function findPendingByCode(code) {
	const rows = getAuthDatabase().query("SELECT * FROM pairing_requests WHERE status = 'pending'").all();
	const now = Date.now();
	for (const row of rows) {
		if (new Date(row.expires_at).getTime() < now) continue;
		if (hashPairingCode(code, row.id) === row.code_hash) return row;
	}
	return null;
}
function approvePairing(input) {
	const row = findPendingByCode(input.code.trim());
	if (!row) return { error: "Invalid or expired pairing code" };
	if (row.app_id !== input.appId) return { error: "App id does not match pairing request" };
	const normalizedUrl = input.publicUrl.replace(/\/$/, "");
	if (row.public_url !== normalizedUrl) return { error: "Public URL does not match pairing request" };
	const serviceToken = randomToken(32);
	getAuthDatabase().prepare("UPDATE pairing_requests SET status = 'approved' WHERE id = ?").run(row.id);
	upsertPairedApp({
		id: input.appId,
		publicUrl: normalizedUrl,
		serviceToken,
		approvedByLogin: input.approverLogin
	});
	audit(row.id, "approved", input.approverLogin);
	return { serviceToken };
}
function listPairingRequests() {
	return getAuthDatabase().query("SELECT * FROM pairing_requests ORDER BY created_at DESC LIMIT 50").all();
}
//#endregion
export { readAuthConfig as C, verifySetupToken as D, sealHubBrowserSession as E, writeAuthConfig as O, promoteBootstrapAdminIfNeeded as S, resolveOAuthConfig as T, isAdminLogin as _, approvePairing as a, listEnabledApps as b, createUserSession as c, getAppById as d, getGithubTokenForSession as f, hubBrowserSessionCookieHeader as g, getSessionFromRequest as h, addAdminLogin as i, env as l, getServiceTokenForApp as m, AUTH_HUB_ISSUER as n, clearSessionCookieHeader as o, getPairedApp as p, HUB_USER_TOKEN_TTL_SECONDS as r, createPairingRequest as s, AUTH_APP_META as t, getAdminLogins as u, isOAuthConfigured as v, removeAdminLogin as w, listPairingRequests as x, isOnboarded as y };

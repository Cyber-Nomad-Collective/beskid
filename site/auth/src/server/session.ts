import { jwtVerify, SignJWT } from "jose";

import { env } from "#/env";
import {
	getGithubTokenForSession,
	getUserSession,
} from "#/server/repositories/user-sessions";

export const SESSION_COOKIE_NAME = "beskid_auth_session";

export interface HubBrowserSession {
	sessionId: string;
}

export interface AuthSessionPayload {
	sessionId: string;
	login: string;
	avatarUrl: string;
	name: string | null;
}

function sessionSecret(): Uint8Array {
	return new TextEncoder().encode(env.SESSION_SECRET);
}

export async function sealHubBrowserSession(
	payload: HubBrowserSession,
): Promise<string> {
	return new SignJWT({ sid: payload.sessionId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(sessionSecret());
}

async function unsealHubBrowserSession(
	token: string,
): Promise<HubBrowserSession | null> {
	try {
		const { payload } = await jwtVerify(token, sessionSecret());
		if (typeof payload.sid !== "string") return null;
		return { sessionId: payload.sid };
	} catch {
		return null;
	}
}

export async function getSessionFromRequest(
	request: Request,
): Promise<AuthSessionPayload | null> {
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
		name: row.name,
	};
}

export async function getGithubTokenForHubRequest(
	request: Request,
): Promise<string | null> {
	const session = await getSessionFromRequest(request);
	if (!session) return null;
	return getGithubTokenForSession(session.sessionId);
}

export function readSessionCookie(request: Request): string | null {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === SESSION_COOKIE_NAME) {
			return decodeURIComponent(rest.join("="));
		}
	}
	return null;
}

export function hubBrowserSessionCookieHeader(
	token: string,
	maxAgeSeconds = 60 * 60 * 24 * 7,
): string {
	const secure = env.NODE_ENV === "production" ? "; Secure" : "";
	return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearSessionCookieHeader(): string {
	return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** @deprecated use hubBrowserSessionCookieHeader */
export const sessionCookieHeader = hubBrowserSessionCookieHeader;

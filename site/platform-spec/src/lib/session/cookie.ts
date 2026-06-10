import "@tanstack/react-start/server-only";

import { jwtVerify, SignJWT } from "jose";

import { env } from "#/env.server";

export const SESSION_COOKIE_NAME = "beskid_platform_spec_session";

export interface SessionPayload {
	login: string;
	avatarUrl: string;
	name: string | null;
	/** Handoff JWT — GitHub API via auth hub proxy. */
	hubUserToken: string;
	hubSessionId: string;
}

function sessionSecret(): Uint8Array {
	return new TextEncoder().encode(env.SESSION_SECRET);
}

export async function sealSession(payload: SessionPayload): Promise<string> {
	return new SignJWT({ ...payload })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(sessionSecret());
}

export async function unsealSession(
	token: string,
): Promise<SessionPayload | null> {
	try {
		const { payload } = await jwtVerify(token, sessionSecret());
		if (typeof payload.login !== "string") {
			return null;
		}
		if (
			typeof payload.hubUserToken !== "string" ||
			typeof payload.hubSessionId !== "string"
		) {
			return null;
		}

		return {
			login: payload.login,
			avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : "",
			name: typeof payload.name === "string" ? payload.name : null,
			hubUserToken: payload.hubUserToken,
			hubSessionId: payload.hubSessionId,
		};
	} catch {
		return null;
	}
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

export async function getSessionFromRequest(
	request: Request,
): Promise<SessionPayload | null> {
	const token = readSessionCookie(request);
	if (!token) return null;
	return unsealSession(token);
}

export function sessionCookieHeader(
	token: string,
	maxAgeSeconds = 60 * 60 * 24 * 7,
): string {
	const secure = env.NODE_ENV === "production" ? "; Secure" : "";
	return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearSessionCookieHeader(): string {
	return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

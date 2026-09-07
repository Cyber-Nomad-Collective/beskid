import "@tanstack/react-start/server-only";

import { jwtVerify, SignJWT } from "jose";

import type { ShellUser } from "../types";

/**
 * Signed session cookie for Beskid shell apps.
 *
 * After the Authelia ID token is verified (see `oidc.ts`), the verified
 * user claims are sealed into an HS256 JWT cookie signed with
 * `SESSION_SECRET`. `getShellUser` reads + unseals this cookie on every
 * request — no forward-auth headers, no per-request Authelia call.
 *
 * Pattern lifted from `beskid_tracker/src/lib/session/cookie.ts` and
 * `site/auth/src/server/session.ts` (both use `jose` HS256, 7d TTL).
 */

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface ShellSessionConfig {
	/** Session cookie signing key (HS256, 32+ chars). */
	sessionSecret: string;
	/** Session cookie name. */
	sessionCookieName: string;
	/** Whether cookies should carry the `Secure` flag (production). */
	isProduction: boolean;
}

export interface ShellSession {
	/** The session cookie name (read by `getShellUser` / route handlers). */
	SESSION_COOKIE_NAME: string;
	sealShellSession(user: ShellUser): Promise<string>;
	unsealShellSession(token: string): Promise<ShellUser | null>;
	shellSessionCookieHeader(token: string): string;
	clearShellSessionCookieHeader(): string;
	readShellSessionCookie(request: Request): string | null;
}

function sessionSecret(secret: string): Uint8Array {
	if (!secret || secret.length < 32) {
		throw new Error(
			"SESSION_SECRET must be set (32+ chars) to seal/unseal sessions",
		);
	}
	return new TextEncoder().encode(secret);
}

export function createShellSession(config: ShellSessionConfig): ShellSession {
	const secret = () => sessionSecret(config.sessionSecret);
	const secure = config.isProduction ? "; Secure" : "";

	return {
		SESSION_COOKIE_NAME: config.sessionCookieName,
		async sealShellSession(user: ShellUser): Promise<string> {
			return new SignJWT({ ...user })
				.setProtectedHeader({ alg: "HS256" })
				.setIssuedAt()
				.setExpirationTime(`${SESSION_TTL_SECONDS}s`)
				.sign(secret());
		},
		async unsealShellSession(token: string): Promise<ShellUser | null> {
			try {
				const { payload } = await jwtVerify(token, secret(), {
					algorithms: ["HS256"],
				});
				if (typeof payload.username !== "string") return null;
				const email = typeof payload.email === "string" ? payload.email : undefined;
				const name = typeof payload.name === "string" ? payload.name : undefined;
				const avatarUrl =
					typeof payload.avatarUrl === "string" ? payload.avatarUrl : undefined;
				const groups = Array.isArray(payload.groups)
					? payload.groups.filter((g): g is string => typeof g === "string")
					: [];
				return { username: payload.username, email, name, groups, avatarUrl };
			} catch {
				return null;
			}
		},
		shellSessionCookieHeader(token: string): string {
			return `${config.sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
		},
		clearShellSessionCookieHeader(): string {
			return `${config.sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
		},
		readShellSessionCookie(request: Request): string | null {
			const header = request.headers.get("cookie");
			if (!header) return null;
			for (const part of header.split(";")) {
				const [name, ...rest] = part.trim().split("=");
				if (name === config.sessionCookieName) {
					try {
						return decodeURIComponent(rest.join("="));
					} catch {
						return null;
					}
				}
			}
			return null;
		},
	};
}

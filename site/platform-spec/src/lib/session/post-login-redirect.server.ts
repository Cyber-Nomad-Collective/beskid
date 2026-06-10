import "@tanstack/react-start/server-only";

import { env } from "#/env.server";
import { POST_LOGIN_REDIRECT_COOKIE } from "#/lib/session/post-login-redirect";

export function postLoginRedirectCookieHeader(path: string): string {
	const secure = env.NODE_ENV === "production" ? "; Secure" : "";
	return `${POST_LOGIN_REDIRECT_COOKIE}=${encodeURIComponent(path)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900${secure}`;
}

export function clearPostLoginRedirectCookieHeader(): string {
	return `${POST_LOGIN_REDIRECT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

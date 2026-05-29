import { env } from "#/env.server";

export function hubPublicBase(): string {
	return env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");
}

export function hubOAuthCallbackUrl(): string {
	return `${hubPublicBase()}/callback`;
}

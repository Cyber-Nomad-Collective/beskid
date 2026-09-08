/** Browser authentication starts at Learn's Authentik proxy outpost. */

export interface AuthUser {
	login: string;
	name: string | null;
	avatarUrl: string;
}

const AUTHENTIK_BASE: string =
	(typeof import.meta !== "undefined" &&
		(import.meta as any).env?.VITE_AUTHENTIK_URL) ??
	"https://auth.beskid-lang.org";

const LEARN_ORIGIN: string =
	(typeof import.meta !== "undefined" &&
		(import.meta as any).env?.VITE_LEARN_ORIGIN) ??
	"https://learn.beskid-lang.org";

export function authentikLoginUrl(): string {
	const origin = LEARN_ORIGIN.replace(/\/$/, "");
	const url = new URL("/outpost.goauthentik.io/start", origin);
	url.searchParams.set("rd", `${origin}/`);
	return url.toString();
}

export function authentikProfileUrl(): string {
	const base = AUTHENTIK_BASE.replace(/\/$/, "");
	return `${base}/if/user/`;
}

export async function fetchAuthUser(): Promise<AuthUser | null> {
	try {
		const res = await fetch("/api/auth/me");
		if (!res.ok) return null;
		const data = (await res.json()) as { user: AuthUser | null };
		return data.user ?? null;
	} catch {
		return null;
	}
}

export async function logoutUser(): Promise<void> {
	await fetch("/api/auth/logout", { method: "POST" });
}

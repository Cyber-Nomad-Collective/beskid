import { getRequest } from "@tanstack/react-start/server";

import { getSessionFromRequest } from "#/lib/session/cookie";

export interface AuthUser {
	login: string;
	name: string | null;
	avatarUrl: string;
}

export async function resolveAuthUser(): Promise<AuthUser | null> {
	const request = getRequest();
	const session = await getSessionFromRequest(request);
	if (!session) return null;
	return {
		login: session.login,
		name: session.name,
		avatarUrl: session.avatarUrl,
	};
}

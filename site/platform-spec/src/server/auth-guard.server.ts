import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { createHubOctokit } from "#/lib/github/hub-octokit.server";
import { canModerateSpec } from "#/lib/github/permissions";
import {
	getSessionFromRequest,
	type SessionPayload,
} from "#/lib/session/cookie";

export async function requireSession(): Promise<SessionPayload> {
	const request = getRequest();
	const session = await getSessionFromRequest(request);
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		await requireSession();
		return next();
	},
);

export function createOctokitForSession(session: SessionPayload) {
	return createHubOctokit(session.hubUserToken);
}

export async function withOctokit<T>(
	fn: (octokit: ReturnType<typeof createHubOctokit>) => Promise<T>,
): Promise<T> {
	const session = await requireSession();
	return fn(createOctokitForSession(session));
}

export async function withAuth<T>(
	fn: (
		octokit: ReturnType<typeof createHubOctokit>,
		login: string,
	) => Promise<T>,
): Promise<T> {
	const session = await requireSession();
	return fn(createOctokitForSession(session), session.login);
}

export async function withAuthUser<T>(
	fn: (ctx: {
		login: string;
		octokit: ReturnType<typeof createHubOctokit>;
	}) => Promise<T>,
): Promise<T> {
	const session = await requireSession();
	return fn({
		login: session.login,
		octokit: createOctokitForSession(session),
	});
}

export async function requireMaintainer(): Promise<SessionPayload> {
	const session = await requireSession();
	await withOctokit(async (octokit) => {
		if (!(await canModerateSpec(octokit, session.login))) {
			throw new Error("Only moderators can access this resource");
		}
	});
	return session;
}

import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import type { Octokit } from "@octokit/rest";
import { createMiddleware } from "@tanstack/react-start";
import { isConfiguredModerator } from "#/lib/github/permissions";
import { getShellUser } from "#/server/shell-user";

/**
 * Auth guard for the platform-spec edit/moderation surface.
 *
 * Identity comes from the Authelia OIDC session (see `server/shell-user.ts` →
 * `server/authelia-middleware.ts`), replacing the old Beskid auth-hub pairing +
 * JWT-handoff flow. The previous `SessionPayload` carried a `hubUserToken`
 * used to proxy GitHub API calls through the auth hub; Authelia's ID token
 * gives a GitHub identity but **not** a repo-write OAuth token, so the
 * Octokit factory here is **fail-closed**: it returns a lazy proxy that
 * throws `GITHUB_WRITE_TOKEN_NOT_CONFIGURED` on first use.
 *
 * Consequences (see MIGRATION-NOTES.md):
 *  - Draft list/create/update/delete (login-only, no Octokit) keep working.
 *  - Moderation gate uses `isConfiguredModerator` (env `PLATFORM_SPEC_MODERATOR_LOGINS`)
 *    — repo-admin-based moderation is suspended until the token issue is resolved.
 *  - Draft approval / PR creation (`createDraftPullRequest`) fails closed.
 */

export interface SessionPayload {
	login: string;
	name: string | null;
	avatarUrl: string;
}

function toSession(user: ShellUser): SessionPayload {
	return {
		login: user.username,
		name: user.name ?? null,
		avatarUrl: user.avatarUrl ?? `https://github.com/${user.username}.png`,
	};
}

export async function requireSession(): Promise<SessionPayload> {
	const user = await getShellUser();
	if (!user) {
		throw new Error("Unauthorized");
	}
	return toSession(user);
}

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		await requireSession();
		return next();
	},
);

const GITHUB_TOKEN_ERROR = new Error(
	"GITHUB_WRITE_TOKEN_NOT_CONFIGURED: GitHub PR creation requires a server-side GitHub App/installation token. The Authelia ID token does not carry a repo-write OAuth token. See MIGRATION-NOTES.md.",
);

/**
 * Fail-closed Octokit: returns a proxy that throws on first property access.
 * Login-only draft operations never touch it; only PR creation / repo-permission
 * checks do, and they fail with a clear message until the token issue is
 * resolved.
 */
export function createOctokitForSession(_session: SessionPayload): Octokit {
	return new Proxy({} as Octokit, {
		get() {
			throw GITHUB_TOKEN_ERROR;
		},
	}) as Octokit;
}

export async function withOctokit<T>(
	fn: (octokit: Octokit) => Promise<T>,
): Promise<T> {
	const session = await requireSession();
	return fn(createOctokitForSession(session));
}

export async function withAuth<T>(
	fn: (octokit: Octokit, login: string) => Promise<T>,
): Promise<T> {
	const session = await requireSession();
	return fn(createOctokitForSession(session), session.login);
}

export async function withAuthUser<T>(
	fn: (ctx: { login: string; octokit: Octokit }) => Promise<T>,
): Promise<T> {
	const session = await requireSession();
	return fn({
		login: session.login,
		octokit: createOctokitForSession(session),
	});
}

/**
 * Require a moderator. Without a GitHub write token we cannot verify
 * repo-admin permissions, so only configured moderators (env
 * `PLATFORM_SPEC_MODERATOR_LOGINS`) are admitted — everyone else is denied
 * (fail closed). Repo-admin-based moderation is suspended until the token
 * issue is resolved. See MIGRATION-NOTES.md.
 */
export async function requireMaintainer(): Promise<SessionPayload> {
	const session = await requireSession();
	if (!isConfiguredModerator(session.login)) {
		throw new Error("Only configured moderators can access this resource");
	}
	return session;
}

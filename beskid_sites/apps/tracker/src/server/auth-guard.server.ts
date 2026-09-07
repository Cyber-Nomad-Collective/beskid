import "@tanstack/react-start/server-only";

import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import type { Octokit } from "@octokit/rest";
import { getCookie } from "@tanstack/react-start/server";
import { env } from "#/env.server";
import { resolveShellUser, SESSION_COOKIE_NAME } from "#/server/shell-auth";

/**
 * Auth guards for the tracker, rewritten onto the shell-template's Authelia
 * session cookie.
 *
 * The old tracker sealed a `hubUserToken` (GitHub OAuth token from the auth
 * hub) into the session and built a per-user Octokit against the hub's GitHub
 * proxy. Under Authelia there is no per-user GitHub token — Authelia only
 * vouches for identity. The Octokit-dependent surfaces (bug export to GitHub,
 * webhook provisioning) therefore **fail closed** until a server-side GitHub
 * token solution is wired (see MIGRATION-NOTES.md).
 *
 * `canManageRoadmap` is remapped from a live Octokit repo-permission check to
 * an Authelia group membership check (`TRACKER_MAINTAINER_GROUP`, default
 * `beskid-admins`). This is a deliberate semantics change documented in
 * MIGRATION-NOTES.md.
 */

/**
 * Resolve the authenticated ShellUser for the current request, or throw.
 * Replaces the old `requireSession` (which returned a SessionPayload with a
 * hubUserToken).
 */
export async function requireSession(): Promise<ShellUser> {
	const token = getCookie(SESSION_COOKIE_NAME) ?? null;
	const user = await resolveShellUser(token);
	if (!user) {
		throw new Error("Unauthorized");
	}
	return user;
}

/**
 * Octokit placeholder that fails closed on any property access.
 *
 * Most tracker write services take an Octokit argument but ignore it (data
 * goes to SQLite). Only the GitHub-export / webhook-provision paths actually
 * call Octokit — those trigger this proxy and surface a clear error pointing
 * at MIGRATION-NOTES.md.
 */
function failClosedOctokit(): Octokit {
	const error = new Error(
		"GitHub API access is not available under Authelia. A server-side " +
			"GitHub token solution is required for bug export / webhook provisioning. " +
			"See beskid_sites/apps/tracker/MIGRATION-NOTES.md.",
	);
	return new Proxy({} as Octokit, {
		get() {
			throw error;
		},
	});
}

/** Run `fn` with a fail-closed Octokit (see above). Requires a session. */
export async function withOctokit<T>(
	fn: (octokit: Octokit) => Promise<T>,
): Promise<T> {
	await requireSession();
	return fn(failClosedOctokit());
}

/**
 * Run `fn` with the resolved ShellUser and a fail-closed Octokit.
 * The second argument is the ShellUser (replaces the old `login: string`).
 */
export async function withAuth<T>(
	fn: (octokit: Octokit, user: ShellUser) => Promise<T>,
): Promise<T> {
	const user = await requireSession();
	return fn(failClosedOctokit(), user);
}

/** Run `fn` with `{ login, octokit }`. `login` is the ShellUser username. */
export async function withAuthUser<T>(
	fn: (ctx: { login: string; octokit: Octokit }) => Promise<T>,
): Promise<T> {
	const user = await requireSession();
	return fn({ login: user.username, octokit: failClosedOctokit() });
}

/**
 * Require the maintainer group. Replaces the old Octokit repo-permission check
 * with an Authelia group membership check.
 */
export async function requireMaintainer(): Promise<ShellUser> {
	const user = await requireSession();
	if (!canManageRoadmap(user)) {
		throw new Error(
			`Only members of the ${env.TRACKER_MAINTAINER_GROUP} group can manage sync settings`,
		);
	}
	return user;
}

/**
 * Whether the user can manage the roadmap. Remapped from a live Octokit
 * `repos.getCollaboratorPermission` check to an Authelia group membership check
 * (`TRACKER_MAINTAINER_GROUP`, default `beskid-admins`).
 *
 * Sync (no Octokit, no network) — safe to call in loaders/beforeLoad.
 */
export function canManageRoadmap(user: ShellUser | null): boolean {
	if (!user) return false;
	return user.groups.includes(env.TRACKER_MAINTAINER_GROUP);
}

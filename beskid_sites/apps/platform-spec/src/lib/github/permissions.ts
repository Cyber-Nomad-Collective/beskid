import type { Octokit } from "@octokit/rest";

import { env } from "#/env.server";
import { repoParams } from "#/lib/github/octokit";

/** Repo owner or org admin can manage versions and spec approvals. */
export async function canManageRoadmap(
	octokit: Octokit,
	login: string,
): Promise<boolean> {
	const { data: repo } = await octokit.repos.get(repoParams());

	if (repo.owner.login === login) {
		return true;
	}

	try {
		const { data: perm } = await octokit.repos.getCollaboratorPermissionLevel({
			...repoParams(),
			username: login,
		});
		return perm.permission === "admin";
	} catch {
		return false;
	}
}

export function isConfiguredModerator(login: string): boolean {
	const normalized = login.trim().toLowerCase();
	return env.PLATFORM_SPEC_MODERATOR_LOGINS.some(
		(entry) => entry.trim().toLowerCase() === normalized,
	);
}

/** Repo admins on the Beskid OAuth GitHub app home repo may configure normative spec links. */
export async function canConfigureNormativeRepo(
	octokit: Octokit,
	login: string,
): Promise<boolean> {
	if (isConfiguredModerator(login)) {
		return true;
	}

	const oauthOwner = env.GITHUB_OAUTH_REPO_OWNER;
	const oauthRepo = env.GITHUB_OAUTH_REPO_NAME;
	try {
		const { data: perm } = await octokit.repos.getCollaboratorPermissionLevel({
			owner: oauthOwner,
			repo: oauthRepo,
			username: login,
		});
		if (perm.permission === "admin") {
			return true;
		}
	} catch {
		// fall through
	}

	return canManageRoadmap(octokit, login);
}

export async function canModerateSpec(
	octokit: Octokit,
	login: string,
): Promise<boolean> {
	if (isConfiguredModerator(login)) {
		return true;
	}
	return canManageRoadmap(octokit, login);
}

import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { isConfiguredModerator } from "#/lib/github/permissions";
import { requireSession } from "#/server/auth-guard.server";
import { listPendingReviewFn } from "#/server/drafts";
import { loadOpenSpecCatalog } from "#/server/openspec/reader";

/**
 * Moderation gate.
 *
 * Without a GitHub write token (see MIGRATION-NOTES.md) we cannot verify
 * repo-admin permissions via the GitHub API, so the gate is the pure env
 * check `isConfiguredModerator` (`PLATFORM_SPEC_MODERATOR_LOGINS`).
 * Repo-admin-based moderation is suspended until the token issue is resolved.
 */
export const loadModerationPageFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await requireSession();
		const canModerate = isConfiguredModerator(session.login);

		if (!canModerate) {
			throw redirect({ to: "/edit" });
		}

		const catalog = loadOpenSpecCatalog();
		return {
			queue: await listPendingReviewFn(),
			canModerate,
			currentCatalogRevision: catalog.revision,
		};
	},
);

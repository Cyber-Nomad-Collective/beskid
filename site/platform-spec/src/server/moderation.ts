import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { canModerateSpec } from "#/lib/github/permissions";
import { requireSession, withOctokit } from "#/server/auth-guard.server";
import { listPendingReviewFn } from "#/server/drafts";
import { loadOpenSpecCatalog } from "#/server/openspec/reader";

export const loadModerationPageFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await requireSession();
		const canModerate = await withOctokit((octokit) =>
			canModerateSpec(octokit, session.login),
		);

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

import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import {
	canConfigureNormativeRepo,
	canModerateSpec,
} from "#/lib/github/permissions";
import { requireSession, withOctokit } from "#/server/auth-guard.server";
import { listPendingReviewFn } from "#/server/drafts";
import { fetchNormativeRepoSettingsFn } from "#/server/normative-repo-settings";

export const loadModerationPageFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await requireSession();
		const [canEdit, canModerate, repoSettings] = await Promise.all([
			withOctokit((octokit) => canConfigureNormativeRepo(octokit, session.login)),
			withOctokit((octokit) => canModerateSpec(octokit, session.login)),
			fetchNormativeRepoSettingsFn(),
		]);

		if (!canEdit && !canModerate) {
			throw redirect({ to: "/edit" });
		}

		const queue = canModerate ? await listPendingReviewFn() : [];

		return { queue, repoSettings, canEdit, canModerate };
	},
);

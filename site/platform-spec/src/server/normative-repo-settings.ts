import { createServerFn } from "@tanstack/react-start";

import { canConfigureNormativeRepo } from "#/lib/github/permissions";
import {
	getNormativeRepoSettings,
	saveNormativeRepoUrl,
} from "#/lib/spec-repo-settings.server";
import { requireSession, withOctokit } from "#/server/auth-guard.server";

export const fetchNormativeRepoSettingsFn = createServerFn({
	method: "GET",
}).handler(async () => {
	await requireSession();
	return getNormativeRepoSettings();
});

export const updateNormativeRepoSettingsFn = createServerFn({ method: "POST" })
	.inputValidator((data: { repoUrl: string }) => data)
	.handler(async ({ data }) => {
		const session = await requireSession();
		await withOctokit(async (octokit) => {
			if (!(await canConfigureNormativeRepo(octokit, session.login))) {
				throw new Error(
					"Only Beskid GitHub OAuth repo maintainers can change the normative spec repository link",
				);
			}
		});
		return saveNormativeRepoUrl(data.repoUrl);
	});

import { createServerFn } from "@tanstack/react-start";

import type { FlatSpecNavEntry } from "#/lib/platform-spec/nav";
import { withAuth } from "#/server/auth-guard.server";
import * as platformSpecServer from "#/server/platform-spec.server";

export interface IssueSpecSuggestion {
	standardId?: string;
	slug: string;
	href: string;
	title: string;
	level: string;
	score: number;
	matchedTerms: string[];
	alreadyLinked: boolean;
}

export const searchPlatformSpecNav = createServerFn({ method: "GET" })
	.inputValidator((data: { query: string; limit?: number }) => data)
	.handler(async ({ data }): Promise<FlatSpecNavEntry[]> => {
		const entries = await platformSpecServer.loadNavEntries();
		return platformSpecServer.searchPlatformSpecNavEntries(
			entries,
			data.query,
			data.limit ?? 20,
		);
	});

export const suggestPlatformSpecNavForIssue = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { versionId: string; taskId: string; limit?: number }) => data,
	)
	.handler(
		async ({ data }): Promise<IssueSpecSuggestion[]> =>
			withAuth(() =>
				platformSpecServer.suggestPlatformSpecNavForTask(
					data.versionId,
					data.taskId,
					data.limit ?? 8,
				),
			),
	);

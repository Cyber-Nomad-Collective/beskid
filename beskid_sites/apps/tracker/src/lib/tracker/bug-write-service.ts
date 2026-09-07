import "@tanstack/react-start/server-only";

import type { Octokit } from "@octokit/rest";

import type { PublicBug } from "#/lib/github/types";
import {
	type CreatePublicBugInput,
	createPublicBug,
} from "#/lib/tracker/bug-service";
import { drainGithubSyncOutbox } from "#/lib/tracker/process-outbox";

export async function createPublicBugForSession(
	octokit: Octokit,
	input: CreatePublicBugInput & {
		componentId: string;
		subcomponentId: string;
	},
): Promise<PublicBug> {
	const bugInput: CreatePublicBugInput = {
		title: input.title,
		body: input.body,
		author: input.author,
		fields: input.fields,
		componentId: input.componentId,
		subcomponentId: input.subcomponentId,
	};

	const bug = await createPublicBug(bugInput);
	await drainGithubSyncOutbox(octokit).catch(() => undefined);
	return bug;
}

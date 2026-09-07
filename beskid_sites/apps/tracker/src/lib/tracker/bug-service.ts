import "@tanstack/react-start/server-only";

import type { PublicBug } from "#/lib/github/types";
import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import { trackerBugToPublicBug } from "#/lib/tracker/mappers";
import {
	type UpsertTrackerBugInput,
	upsertTrackerBug,
} from "#/lib/tracker/repositories/bugs-repository";
import { getGithubIssueLink } from "#/lib/tracker/repositories/github-links-repository";
import { enqueueGithubSync } from "#/lib/tracker/repositories/outbox-repository";
import { isBugInGithubSyncScope } from "#/lib/tracker/sync-scope";

export interface CreatePublicBugInput {
	title: string;
	body: string;
	author?: string;
	componentId?: string;
	subcomponentId?: string;
	fields?: Record<string, unknown>;
	bugId?: string;
}

function uniqueBugId(): string {
	return crypto.randomUUID();
}

function maybeEnqueueBugSync(db: Database, bugId: string): void {
	if (!isBugInGithubSyncScope({ id: bugId })) return;
	enqueueGithubSync(db, {
		entityType: "bug",
		entityId: bugId,
		operation: "create",
	});
}

export async function createPublicBug(
	input: CreatePublicBugInput,
	db?: Database,
): Promise<PublicBug> {
	const database = db ?? getIssuesDatabase();
	const bugId = input.bugId ?? uniqueBugId();
	const upsertInput: UpsertTrackerBugInput = {
		id: bugId,
		title: input.title.trim(),
		body: input.body.trim(),
		state: "open",
		author: input.author,
		componentId: input.componentId,
		subcomponentId: input.subcomponentId,
		fields: input.fields ?? {},
	};

	const tx = database.transaction(() => {
		upsertTrackerBug(database, upsertInput);
		maybeEnqueueBugSync(database, bugId);
	});
	tx();

	const githubLink = getGithubIssueLink("bug", bugId, database) ?? undefined;
	return trackerBugToPublicBug({
		id: bugId,
		title: upsertInput.title,
		body: upsertInput.body ?? "",
		state: "open",
		author: upsertInput.author,
		componentId: upsertInput.componentId,
		subcomponentId: upsertInput.subcomponentId,
		fields: upsertInput.fields ?? {},
		localUpdatedAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		githubLink,
	});
}

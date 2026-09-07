import "@tanstack/react-start/server-only";

import type { Octokit } from "@octokit/rest";

import { BUG_LABEL } from "#/lib/github/bug-mappers";
import { repoParams } from "#/lib/github/octokit";
import { getIssuesDatabase } from "#/lib/storage/db";
import type { GitHubIssuePayload } from "#/lib/storage/stored-issue";
import { isGithubSyncOutboxEntrySupported } from "#/lib/tracker/bug-only-sync-policy";
import { getTrackerBug } from "#/lib/tracker/repositories/bugs-repository";
import {
	getGithubIssueLink,
	upsertGithubIssueLink,
} from "#/lib/tracker/repositories/github-links-repository";
import {
	deleteGithubSyncOutboxEntry,
	listGithubSyncOutbox,
	markGithubSyncAttempt,
} from "#/lib/tracker/repositories/outbox-repository";
import { isBugInGithubSyncScope } from "#/lib/tracker/sync-scope";
import {
	getTrackerSyncSettings,
	markTrackerExportCompleted,
} from "#/lib/tracker/sync-settings";
import type { GithubSyncOutboxEntry } from "#/lib/tracker/types";

export interface GithubExportResult {
	processed: number;
	succeeded: number;
	failed: number;
	skipped: number;
	errors: string[];
}

async function fetchGithubIssue(
	octokit: Octokit,
	issueNumber: number,
): Promise<GitHubIssuePayload> {
	const { data } = await octokit.rest.issues.get({
		...repoParams(),
		issue_number: issueNumber,
	});
	return data;
}

async function exportBugEntry(
	octokit: Octokit,
	entry: GithubSyncOutboxEntry,
): Promise<void> {
	const db = getIssuesDatabase();
	const bug = getTrackerBug(entry.entityId, db);
	if (!bug) {
		throw new Error(`Bug not found: ${entry.entityId}`);
	}
	if (!isBugInGithubSyncScope(bug)) {
		return;
	}

	const link = getGithubIssueLink("bug", entry.entityId, db);
	const state = bug.state;
	const body = bug.body.trim() || undefined;

	if (entry.operation === "delete") {
		if (!link) return;
		await octokit.rest.issues.update({
			...repoParams(),
			issue_number: link.githubNumber,
			state: "closed",
		});
		const data = await fetchGithubIssue(octokit, link.githubNumber);
		upsertGithubIssueLink(db, {
			entityType: "bug",
			entityId: entry.entityId,
			githubNumber: link.githubNumber,
			githubUrl: data.html_url,
			githubUpdatedAt: data.updated_at ?? undefined,
			syncState: "synced",
		});
		return;
	}

	if (link) {
		await octokit.rest.issues.update({
			...repoParams(),
			issue_number: link.githubNumber,
			title: bug.title,
			body,
			state,
		});
		if (entry.operation !== "labels") {
			await octokit.rest.issues.setLabels({
				...repoParams(),
				issue_number: link.githubNumber,
				labels: [BUG_LABEL],
			});
		}
		const data = await fetchGithubIssue(octokit, link.githubNumber);
		upsertGithubIssueLink(db, {
			entityType: "bug",
			entityId: entry.entityId,
			githubNumber: link.githubNumber,
			githubUrl: data.html_url,
			githubUpdatedAt: data.updated_at ?? undefined,
			syncState: "synced",
		});
		return;
	}

	const { data } = await octokit.rest.issues.create({
		...repoParams(),
		title: bug.title,
		body,
		labels: [BUG_LABEL],
		state,
	});
	upsertGithubIssueLink(db, {
		entityType: "bug",
		entityId: entry.entityId,
		githubNumber: data.number,
		githubUrl: data.html_url,
		githubUpdatedAt: data.updated_at ?? undefined,
		syncState: "synced",
	});
}

async function processOutboxEntry(
	octokit: Octokit,
	entry: GithubSyncOutboxEntry,
	exportBugs: boolean,
): Promise<"succeeded" | "skipped"> {
	if (!isGithubSyncOutboxEntrySupported(entry) || !exportBugs) return "skipped";
	await exportBugEntry(octokit, entry);
	return "succeeded";
}

export async function processGithubSyncOutboxEntries(
	octokit: Octokit,
	limit = 100,
): Promise<GithubExportResult> {
	const db = getIssuesDatabase();
	const settings = getTrackerSyncSettings(db);
	if (!settings.enabled) {
		return {
			processed: 0,
			succeeded: 0,
			failed: 0,
			skipped: 0,
			errors: [],
		};
	}

	const entries = listGithubSyncOutbox(limit, db);
	const result: GithubExportResult = {
		processed: entries.length,
		succeeded: 0,
		failed: 0,
		skipped: 0,
		errors: [],
	};

	for (const entry of entries) {
		try {
			const outcome = await processOutboxEntry(
				octokit,
				entry,
				settings.exportBugs,
			);
			if (outcome === "skipped") {
				result.skipped += 1;
				deleteGithubSyncOutboxEntry(entry.id, db);
				continue;
			}
			deleteGithubSyncOutboxEntry(entry.id, db);
			result.succeeded += 1;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "GitHub export failed";
			markGithubSyncAttempt(entry.id, message, db);
			result.failed += 1;
			result.errors.push(`${entry.entityType}:${entry.entityId}: ${message}`);
		}
	}

	if (result.succeeded > 0) {
		markTrackerExportCompleted(db);
	}

	return result;
}

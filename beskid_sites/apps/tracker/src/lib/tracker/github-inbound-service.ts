import "@tanstack/react-start/server-only";

import { issueToPublicBug } from "#/lib/github/bug-mappers";
import { getIssuesDatabase } from "#/lib/storage/db";
import type { GitHubIssuePayload } from "#/lib/storage/stored-issue";
import { recordGithubWebhookDelivery } from "#/lib/sync/github-webhook-config";
import { classifyGithubIssueForSync } from "#/lib/tracker/bug-only-sync-policy";
import {
	applyInboundTrackerBug,
	getTrackerBug,
} from "#/lib/tracker/repositories/bugs-repository";
import {
	deleteGithubIssueLink,
	getGithubIssueLink,
	getGithubIssueLinkByNumber,
	upsertGithubIssueLink,
} from "#/lib/tracker/repositories/github-links-repository";
import { isBugInGithubSyncScope } from "#/lib/tracker/sync-scope";
import {
	getTrackerSyncSettings,
	markTrackerInboundCompleted,
} from "#/lib/tracker/sync-settings";

export interface GithubInboundResult {
	applied: boolean;
	entityType?: "bug";
	entityId?: string;
	conflict?: boolean;
	skipped?: boolean;
	reason?: string;
}

interface IssuesWebhookPayload {
	action: string;
	issue?: GitHubIssuePayload;
}

function githubUpdatedAt(issue: GitHubIssuePayload): string {
	return issue.updated_at ?? new Date().toISOString();
}

function hasConcurrentEdit(
	localUpdatedAt: string,
	githubUpdatedAtValue: string,
	lastSyncedAt: string | undefined,
	previousGithubUpdatedAt: string | undefined,
): boolean {
	if (!lastSyncedAt) return false;
	const localChanged = localUpdatedAt > lastSyncedAt;
	const githubChanged =
		githubUpdatedAtValue > (previousGithubUpdatedAt ?? lastSyncedAt);
	return localChanged && githubChanged;
}

function applyInboundBug(issue: GitHubIssuePayload): GithubInboundResult {
	const db = getIssuesDatabase();
	const bug = issueToPublicBug(issue);
	if (!bug) {
		return { applied: false, skipped: true, reason: "not-a-bug" };
	}
	if (!isBugInGithubSyncScope({ id: bug.number.toString() })) {
		return { applied: false, skipped: true, reason: "out-of-scope" };
	}

	const entityId = String(bug.number);
	const link =
		getGithubIssueLink("bug", entityId, db) ??
		getGithubIssueLinkByNumber(issue.number, db);
	const existing = getTrackerBug(link?.entityId ?? entityId, db);
	const githubAt = githubUpdatedAt(issue);

	if (existing && link) {
		const concurrent = hasConcurrentEdit(
			existing.localUpdatedAt,
			githubAt,
			link.lastSyncedAt,
			link.githubUpdatedAt,
		);
		if (concurrent) {
			if (githubAt > existing.localUpdatedAt) {
				applyInboundTrackerBug(db, existing.id, {
					title: issue.title,
					body: issue.body ?? "",
					state: issue.state === "closed" ? "closed" : "open",
					author: issue.user?.login,
					localUpdatedAt: githubAt,
				});
				upsertGithubIssueLink(db, {
					entityType: "bug",
					entityId: existing.id,
					githubNumber: issue.number,
					githubUrl: issue.html_url,
					githubUpdatedAt: githubAt,
					syncState: "synced",
				});
				return {
					applied: true,
					entityType: "bug",
					entityId: existing.id,
				};
			}
			upsertGithubIssueLink(db, {
				entityType: "bug",
				entityId: existing.id,
				githubNumber: issue.number,
				githubUrl: issue.html_url,
				githubUpdatedAt: githubAt,
				syncState: "synced",
			});
			return {
				applied: false,
				entityType: "bug",
				entityId: existing.id,
				skipped: true,
				reason: "local-newer",
			};
		}
	}

	const resolvedEntityId = link?.entityId ?? entityId;
	applyInboundTrackerBug(db, resolvedEntityId, {
		title: issue.title,
		body: issue.body ?? "",
		state: issue.state === "closed" ? "closed" : "open",
		author: issue.user?.login,
		localUpdatedAt: githubAt,
	});
	upsertGithubIssueLink(db, {
		entityType: "bug",
		entityId: resolvedEntityId,
		githubNumber: issue.number,
		githubUrl: issue.html_url,
		githubUpdatedAt: githubAt,
		syncState: "synced",
	});
	return {
		applied: true,
		entityType: "bug",
		entityId: resolvedEntityId,
	};
}

export function applyGithubIssueInbound(
	payload: IssuesWebhookPayload,
): GithubInboundResult {
	const issue = payload.issue;
	if (!issue?.number || issue.pull_request) {
		return { applied: false, skipped: true, reason: "unsupported-issue" };
	}

	const db = getIssuesDatabase();
	const settings = getTrackerSyncSettings(db);
	if (!settings.enabled) {
		return { applied: false, skipped: true, reason: "sync-disabled" };
	}
	if (classifyGithubIssueForSync(issue) !== "bug") {
		return {
			applied: false,
			skipped: true,
			reason: "unsupported-non-bug",
		};
	}

	if (payload.action === "deleted") {
		const link = getGithubIssueLinkByNumber(issue.number, db);
		if (link?.entityType === "bug") {
			deleteGithubIssueLink(link.entityType, link.entityId, db);
		}
		recordGithubWebhookDelivery(payload.action);
		markTrackerInboundCompleted(db);
		return {
			applied: true,
			entityType: link?.entityType,
			entityId: link?.entityId,
			reason: "deleted",
		};
	}

	const result = applyInboundBug(issue);

	recordGithubWebhookDelivery(payload.action);
	if (result.applied) {
		markTrackerInboundCompleted(db);
	}

	return result;
}

import "@tanstack/react-start/server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { GitHubIssuePayload } from "#/lib/storage/stored-issue";
import { applyGithubIssueInbound } from "#/lib/tracker/github-inbound-service";

export {
	getGithubWebhookSecret,
	githubWebhookUrl,
	isGithubSyncDisabled,
	isGithubWebhookConfigured,
	resolveTrackerPublicOrigin,
} from "#/lib/sync/github-webhook-config";

export function verifyGithubWebhookSignature(
	rawBody: string,
	signatureHeader: string | null,
	secret: string,
): boolean {
	if (!signatureHeader?.startsWith("sha256=")) return false;

	const expected = createHmac("sha256", secret)
		.update(rawBody, "utf8")
		.digest("hex");
	const received = signatureHeader.slice("sha256=".length);

	if (received.length !== expected.length) return false;

	try {
		return timingSafeEqual(
			Buffer.from(received, "hex"),
			Buffer.from(expected, "hex"),
		);
	} catch {
		return false;
	}
}

interface IssuesWebhookPayload {
	action: string;
	issue?: GitHubIssuePayload;
}

export function handleGithubIssuesWebhook(payload: IssuesWebhookPayload): void {
	const issue = payload.issue;
	if (!issue?.number) return;
	if (issue.pull_request) return;

	applyGithubIssueInbound(payload);
}

import { BUG_LABEL } from "#/lib/github/bug-mappers";
import type { GitHubIssuePayload } from "#/lib/storage/stored-issue";

export function isGithubSyncOutboxEntrySupported(entry: {
	entityType: string;
}): boolean {
	return entry.entityType === "bug";
}

export function classifyGithubIssueForSync(
	issue: GitHubIssuePayload,
): "bug" | "unsupported" {
	if (issue.pull_request) return "unsupported";
	const labels = issue.labels ?? [];
	const isBug = labels.some((label) =>
		typeof label === "string" ? label === BUG_LABEL : label.name === BUG_LABEL,
	);
	return isBug ? "bug" : "unsupported";
}

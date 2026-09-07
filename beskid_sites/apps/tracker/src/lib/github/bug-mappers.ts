import type { RestEndpointMethodTypes } from "@octokit/rest";

import type { PublicBug } from "#/lib/github/types";

export const BUG_LABEL = "bug";

type GitHubIssue =
	RestEndpointMethodTypes["issues"]["listForRepo"]["response"]["data"][number];

function labelNamesFromIssue(issue: GitHubIssue): string[] {
	return (issue.labels ?? [])
		.map((label) => (typeof label === "string" ? label : label.name))
		.filter((name): name is string => Boolean(name));
}

function bodyExcerpt(body: string, max = 240): string {
	const trimmed = body.trim().replace(/\s+/g, " ");
	if (trimmed.length <= max) return trimmed;
	return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function issueToPublicBug(issue: GitHubIssue): PublicBug | null {
	if (issue.pull_request) return null;

	const labelNames = labelNamesFromIssue(issue);
	if (!labelNames.includes(BUG_LABEL)) return null;

	const body = issue.body ?? "";

	return {
		number: issue.number,
		title: issue.title,
		state: issue.state ?? "open",
		htmlUrl: issue.html_url,
		createdAt: issue.created_at ?? "",
		labels: labelNames,
		bodyExcerpt: bodyExcerpt(body),
		author: issue.user?.login,
	};
}

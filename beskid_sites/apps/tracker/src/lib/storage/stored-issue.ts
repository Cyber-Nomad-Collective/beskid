import type { RestEndpointMethodTypes } from "@octokit/rest";

export type GitHubIssuePayload =
	RestEndpointMethodTypes["issues"]["listForRepo"]["response"]["data"][number];

export type StoredIssuePayload = Pick<
	GitHubIssuePayload,
	| "number"
	| "title"
	| "body"
	| "state"
	| "html_url"
	| "created_at"
	| "pull_request"
	| "labels"
	| "user"
	| "assignees"
	| "milestone"
>;

export function issuePayloadFromGithub(
	issue: GitHubIssuePayload,
): StoredIssuePayload {
	return {
		number: issue.number,
		title: issue.title,
		body: issue.body,
		state: issue.state,
		html_url: issue.html_url,
		created_at: issue.created_at,
		pull_request: issue.pull_request,
		labels: issue.labels,
		user: issue.user,
		assignees: issue.assignees,
		milestone: issue.milestone,
	};
}

export function serializeIssuePayload(issue: StoredIssuePayload): string {
	return JSON.stringify(issue);
}

export function parseIssuePayload(raw: string): StoredIssuePayload {
	return JSON.parse(raw) as StoredIssuePayload;
}

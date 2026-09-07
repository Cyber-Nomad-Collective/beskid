import type { Octokit } from "@octokit/rest";

import { repoParams } from "#/lib/github/octokit";

export interface IssueAttachmentUpload {
	name: string;
	contentBase64: string;
}

function sanitizeFileName(name: string): string {
	return (
		name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file"
	);
}

/** Upload files to the repo and add an issue comment with links. */
export async function uploadIssueAttachments(
	octokit: Octokit,
	issueNumber: number,
	attachments: IssueAttachmentUpload[],
): Promise<void> {
	if (attachments.length === 0) return;

	const { owner, repo } = repoParams();
	const links: string[] = [];

	for (const attachment of attachments) {
		const safeName = sanitizeFileName(attachment.name);
		const path = `.tracker/attachments/issue-${issueNumber}/${safeName}`;

		await octokit.rest.repos.createOrUpdateFileContents({
			owner,
			repo,
			path,
			message: `tracker: attachment for #${issueNumber} (${safeName})`,
			content: attachment.contentBase64,
			encoding: "base64",
		});

		links.push(
			`- [${attachment.name}](https://github.com/${owner}/${repo}/blob/main/${path})`,
		);
	}

	await octokit.rest.issues.createComment({
		owner,
		repo,
		issue_number: issueNumber,
		body: `### Attachments\n\n${links.join("\n")}`,
	});
}

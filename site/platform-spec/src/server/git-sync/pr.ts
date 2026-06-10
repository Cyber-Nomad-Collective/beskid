import type { Octokit } from "@octokit/rest";
import "@tanstack/react-start/server-only";

import { normativePathsForSlug } from "@cyber-nomad-collective/spec-core";

import { env } from "#/env.server";
import { repoParams } from "#/lib/github/octokit";
import type { DraftChangeNode } from "#/server/memgraph/types";

const OWNER = () => env.GITHUB_REPO_OWNER;
const REPO = () => env.GITHUB_REPO_NAME;

function draftBranchName(draftId: string): string {
	const short = draftId.replace(/-/g, "").slice(0, 8);
	return `spec/normative/${short}`;
}

async function getBaseSha(octokit: Octokit, baseRef = "main"): Promise<string> {
	const { data } = await octokit.repos.getBranch({
		owner: OWNER(),
		repo: REPO(),
		branch: baseRef,
	});
	return data.commit.sha;
}

async function ensureBranch(
	octokit: Octokit,
	baseRef: string,
	branchName: string,
): Promise<string> {
	const baseSha = await getBaseSha(octokit, baseRef);
	try {
		const ref = await octokit.git.getRef({
			owner: OWNER(),
			repo: REPO(),
			ref: `heads/${branchName}`,
		});
		return ref.data.object.sha;
	} catch {
		await octokit.git.createRef({
			owner: OWNER(),
			repo: REPO(),
			ref: `refs/heads/${branchName}`,
			sha: baseSha,
		});
		return baseSha;
	}
}

function filesForDraft(draft: DraftChangeNode): Array<{
	path: string;
	content: string;
	message: string;
}> {
	if (draft.changeKind === "delete") return [];

	const paths = normativePathsForSlug(draft.slug);
	const nodeMeta = {
		version: 1,
		specLevel: draft.specLevel,
		slug: draft.slug,
		title: draft.title,
		parentSlug: draft.slug.includes("/")
			? draft.slug.replace(/\/[^/]+$/, "")
			: "platform-spec",
		status: "review",
	};

	const files = [
		{
			path: paths.nodeJson,
			content: `${JSON.stringify(nodeMeta, null, 2)}\n`,
			message: `spec: metadata for ${draft.slug}`,
		},
		{
			path: paths.contentMd,
			content: draft.bodyMd.endsWith("\n") ? draft.bodyMd : `${draft.bodyMd}\n`,
			message: `spec: content for ${draft.slug}`,
		},
	];

	if (draft.layoutJson) {
		files.push({
			path: paths.layoutJson,
			content: draft.layoutJson.endsWith("\n")
				? draft.layoutJson
				: `${draft.layoutJson}\n`,
			message: `spec: layout for ${draft.slug}`,
		});
	}

	return files;
}

export interface CreateDraftPrResult {
	branch: string;
	prNumber: number;
	prUrl: string;
}

export async function createDraftPullRequest(
	octokit: Octokit,
	draft: DraftChangeNode,
	baseRef = "main",
): Promise<CreateDraftPrResult> {
	const branch = draft.headBranch ?? draftBranchName(draft.id);
	await ensureBranch(octokit, baseRef, branch);

	if (draft.changeKind === "delete") {
		const paths = normativePathsForSlug(draft.slug);
		for (const repoPath of Object.values(paths)) {
			try {
				const existing = await octokit.repos.getContent({
					owner: OWNER(),
					repo: REPO(),
					path: repoPath,
					ref: branch,
				});
				if (!Array.isArray(existing.data) && existing.data.sha) {
					await octokit.repos.deleteFile({
						owner: OWNER(),
						repo: REPO(),
						path: repoPath,
						message: `spec: remove ${draft.slug}`,
						sha: existing.data.sha,
						branch,
					});
				}
			} catch {
				// already absent
			}
		}
	} else {
		for (const file of filesForDraft(draft)) {
			let sha: string | undefined;
			try {
				const existing = await octokit.repos.getContent({
					owner: OWNER(),
					repo: REPO(),
					path: file.path,
					ref: branch,
				});
				if (!Array.isArray(existing.data) && existing.data.sha) {
					sha = existing.data.sha;
				}
			} catch {
				sha = undefined;
			}

			await octokit.repos.createOrUpdateFileContents({
				owner: OWNER(),
				repo: REPO(),
				path: file.path,
				message: file.message,
				content: Buffer.from(file.content, "utf8").toString("base64"),
				branch,
				sha,
			});
		}
	}

	const prBody = [
		draft.summary || draft.title,
		"",
		"## Change",
		`- **${draft.changeKind}** \`${draft.slug}\` (${draft.specLevel})`,
		"",
		"Normative files: `node.json`, `content.md`, `layout.json`.",
		"",
		`_Opened from Beskid Platform Spec editor by @${draft.authorLogin}._`,
	].join("\n");

	const { data: pr } = await octokit.pulls.create({
		...repoParams(),
		title: draft.title,
		head: branch,
		base: baseRef,
		body: prBody,
	});

	return {
		branch,
		prNumber: pr.number,
		prUrl: pr.html_url,
	};
}

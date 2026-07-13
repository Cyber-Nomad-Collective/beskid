import type { Octokit } from "@octokit/rest";
import "@tanstack/react-start/server-only";

import { env } from "#/env.server";
import { repoParams } from "#/lib/github/octokit";
import type { DraftChangeNode } from "#/server/memgraph/types";
import { resolveOpenSpecEntry } from "#/server/openspec/reader";

const OWNER = () => env.GITHUB_REPO_OWNER;
const REPO = () => env.GITHUB_REPO_NAME;

function draftBranchName(draftId: string): string {
	const short = draftId.replace(/-/g, "").slice(0, 8);
	return `openspec/platform-editor-${short}`;
}

function changeName(draftId: string): string {
	return `platform-editor-${draftId.replace(/-/g, "").slice(0, 8)}`;
}

function capabilityForDraft(draft: DraftChangeNode): string {
	const existing = resolveOpenSpecEntry(draft.slug);
	if (existing) return existing.capability;
	const derived = draft.slug
		.replace(/^platform-spec\/?/, "")
		.split("/")
		.filter((part) => part && part !== "articles" && part !== "adr")
		.slice(0, 3)
		.join("--")
		.replace(/[^a-z0-9-]/gi, "-")
		.toLowerCase();
	return derived || `proposed-${draft.id.replace(/-/g, "").slice(0, 8)}`;
}

function deltaForDraft(draft: DraftChangeNode, capability: string): string {
	const existing = resolveOpenSpecEntry(draft.slug);
	const operation =
		draft.changeKind === "create"
			? "ADDED"
			: draft.changeKind === "delete"
				? "REMOVED"
				: "MODIFIED";
	const requirementTitle = existing?.requirements[0]?.title ?? draft.title;
	const supplied = draft.bodyMd.trim();
	const requirementBody = /^### Requirement:/m.test(supplied)
		? supplied
		: [
				`### Requirement: ${requirementTitle}`,
				draft.changeKind === "delete"
					? "This requirement is removed by the approved OpenSpec change."
					: supplied ||
						draft.summary ||
						`The Beskid standard SHALL define ${draft.title}.`,
				"",
				`#### Scenario: Review ${capability} change`,
				`- **GIVEN** the proposed ${capability} change`,
				"- **WHEN** maintainers validate and merge the OpenSpec change",
				"- **THEN** the canonical capability specification reflects the approved behavior",
			].join("\n");
	return `# Delta for ${capability}\n\n## ${operation} Requirements\n\n${requirementBody}\n`;
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

export function buildOpenSpecChangeFiles(draft: DraftChangeNode): Array<{
	path: string;
	content: string;
	message: string;
}> {
	const change = changeName(draft.id);
	const capability = capabilityForDraft(draft);
	const root = `openspec/changes/${change}`;
	return [
		{
			path: `${root}/.openspec.yaml`,
			content: "schema: spec-driven\n",
			message: `spec: initialize ${change}`,
		},
		{
			path: `${root}/proposal.md`,
			content: `# ${draft.title}\n\n## Why\n\n${draft.summary || "Proposed through the Beskid platform specification editor."}\n\n## What Changes\n\n- ${draft.changeKind} capability \`${capability}\`.\n\n## Impact\n\n- Canonical standard: \`openspec/specs/${capability}/spec.md\`\n`,
			message: `spec: propose ${change}`,
		},
		{
			path: `${root}/tasks.md`,
			content: `# Tasks\n\n- [ ] Validate the delta with \`openspec validate ${change} --strict\`.\n- [ ] Update implementation and conformance evidence.\n- [ ] Archive the change after verification.\n`,
			message: `spec: add tasks for ${change}`,
		},
		{
			path: `${root}/specs/${capability}/spec.md`,
			content: deltaForDraft(draft, capability),
			message: `spec: add ${capability} delta`,
		},
	];
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

	for (const file of buildOpenSpecChangeFiles(draft)) {
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

	const prBody = [
		draft.summary || draft.title,
		"",
		"## Change",
		`- **${draft.changeKind}** \`${draft.slug}\` (${draft.specLevel})`,
		"",
		`OpenSpec change: \`openspec/changes/${changeName(draft.id)}/\`.`,
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

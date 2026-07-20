import type { Octokit } from "@octokit/rest";
import "@tanstack/react-start/server-only";

import { env } from "#/env.server";
import { repoParams } from "#/lib/github/octokit";
import type { DraftChangeNode } from "#/server/memgraph/types";
import {
	loadOpenSpecCatalog,
	resolveOpenSpecEntry,
} from "#/server/openspec/reader";

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
	try {
		const { data: existing } = await octokit.git.getRef({
			owner: OWNER(),
			repo: REPO(),
			ref: `heads/${branchName}`,
		});
		return existing.object.sha;
	} catch (error) {
		if ((error as { status?: number }).status !== 404) throw error;
		const baseSha = await getBaseSha(octokit, baseRef);
		await octokit.git.createRef({
			owner: OWNER(),
			repo: REPO(),
			ref: `refs/heads/${branchName}`,
			sha: baseSha,
		});
		return baseSha;
	}
}

async function assertWriteAccess(octokit: Octokit, login: string): Promise<void> {
	const { data } = await octokit.repos.getCollaboratorPermissionLevel({
		owner: OWNER(),
		repo: REPO(),
		username: login,
	});
	if (!data.permission || !["admin", "maintain", "write"].includes(data.permission)) {
		throw new Error("GitHub write access is required");
	}
}

async function writeFilesAtomically(
	octokit: Octokit,
	branch: string,
	baseCommitSha: string,
	files: Array<{ path: string; content: string }>,
	message: string,
): Promise<void> {
	const { data: parent } = await octokit.git.getCommit({
		owner: OWNER(),
		repo: REPO(),
		commit_sha: baseCommitSha,
	});
	const tree = await Promise.all(
		files.map(async (file) => {
			const { data: blob } = await octokit.git.createBlob({
				owner: OWNER(),
				repo: REPO(),
				content: Buffer.from(file.content, "utf8").toString("base64"),
				encoding: "base64",
			});
			return {
				path: file.path,
				mode: "100644" as const,
				type: "blob" as const,
				sha: blob.sha,
			};
		}),
	);
	const { data: nextTree } = await octokit.git.createTree({
		owner: OWNER(),
		repo: REPO(),
		base_tree: parent.tree.sha,
		tree,
	});
	const { data: commit } = await octokit.git.createCommit({
		owner: OWNER(),
		repo: REPO(),
		message,
		tree: nextTree.sha,
		parents: [baseCommitSha],
	});
	await octokit.git.updateRef({
		owner: OWNER(),
		repo: REPO(),
		ref: `heads/${branch}`,
		sha: commit.sha,
		force: false,
	});
}

export function buildOpenSpecChangeFiles(
	draft: DraftChangeNode,
	sourceRevision: string,
): Array<{
	path: string;
	content: string;
	message: string;
}> {
	const change = changeName(draft.id);
	const capability = capabilityForDraft(draft);
	const root = `openspec/changes/${change}`;
	const files = [
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
	const ledger = {
		draftId: draft.id,
		sourceRevision,
		authorLogin: draft.authorLogin,
		files: files
			.map(({ path, content }) => ({ path, content }))
			.sort((left, right) => left.path.localeCompare(right.path)),
	};
	return [
		{
			path: `${root}/.platform-spec-ledger.json`,
			content: `${JSON.stringify(ledger, null, 2)}\n`,
			message: `spec: record ledger for ${change}`,
		},
		...files,
	];
}

export interface CreateDraftPrResult {
	branch: string;
	prNumber: number;
	prUrl: string;
	reused: boolean;
	sourceRevision: string;
}

export async function createDraftPullRequest(
	octokit: Octokit,
	draft: DraftChangeNode,
	baseRef = "main",
	sourceRevision?: string,
): Promise<CreateDraftPrResult> {
	const catalog = loadOpenSpecCatalog();
	const revision = sourceRevision ?? catalog.revision;
	if (revision !== catalog.revision) {
		throw new Error("catalog revision conflict");
	}

	const { data: authenticated } = await octokit.users.getAuthenticated();
	await assertWriteAccess(octokit, authenticated.login);

	const branch = draft.headBranch ?? draftBranchName(draft.id);
	const open = await octokit.pulls.list({
		owner: OWNER(),
		repo: REPO(),
		state: "open",
		head: `${OWNER()}:${branch}`,
	});
	const existing = open.data[0];
	if (existing) {
		return {
			branch,
			prNumber: existing.number,
			prUrl: existing.html_url,
			reused: true,
			sourceRevision: revision,
		};
	}
	if (draft.prNumber && draft.prUrl) {
		return {
			branch,
			prNumber: draft.prNumber,
			prUrl: draft.prUrl,
			reused: true,
			sourceRevision: revision,
		};
	}

	const baseCommitSha = await ensureBranch(octokit, baseRef, branch);
	const files = buildOpenSpecChangeFiles(draft, revision);
	await writeFilesAtomically(
		octokit,
		branch,
		baseCommitSha,
		files.map(({ path, content }) => ({ path, content })),
		`spec: synchronize platform editor draft ${changeName(draft.id)}`,
	);

	const prBody = [
		draft.summary || draft.title,
		"",
		"## Change",
		`- **${draft.changeKind}** \`${draft.slug}\` (${draft.specLevel})`,
		"",
		`OpenSpec change: \`openspec/changes/${changeName(draft.id)}/\`.`,
		"",
		`Catalog revision: \`${revision}\`.`,
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
		reused: false,
		sourceRevision: revision,
	};
}

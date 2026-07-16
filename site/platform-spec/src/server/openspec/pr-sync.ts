import type { Octokit } from "@octokit/rest";
import "@tanstack/react-start/server-only";

import { env } from "#/env.server";
import { loadOpenSpecCatalog } from "#/server/openspec/reader";

export interface OpenSpecEdit {
	path: string;
	content: string;
}

export interface OpenSpecEditBatch {
	batchId: string;
	sourceRevision: string;
	edits: OpenSpecEdit[];
}

export interface OpenSpecPullRequest {
	number: number;
	url: string;
	branch: string;
	reused: boolean;
	sourceRevision: string;
}

function owner(): string {
	return env.GITHUB_REPO_OWNER;
}

function repo(): string {
	return env.GITHUB_REPO_NAME;
}

function branchFor(login: string, batchId: string): string {
	return `platform-spec/${login}/${batchId}`;
}

function changeRoot(batchId: string): string {
	return `openspec/changes/platform-spec-${batchId}`;
}

function assertBatch(batch: OpenSpecEditBatch): void {
	if (!/^[a-z0-9][a-z0-9-]*$/i.test(batch.batchId)) {
		throw new Error("batchId must contain only letters, numbers, and hyphens");
	}
	if (batch.edits.length === 0) throw new Error("edit batch cannot be empty");
	for (const edit of batch.edits) {
		if (!edit.path || edit.path.startsWith("/") || edit.path.split("/").includes("..")) {
			throw new Error("edit path must be relative to the OpenSpec change");
		}
	}
}

function serializedFiles(batch: OpenSpecEditBatch): OpenSpecEdit[] {
	const root = changeRoot(batch.batchId);
	const ledger = JSON.stringify(
		{
			batchId: batch.batchId,
			sourceRevision: batch.sourceRevision,
			edits: [...batch.edits]
				.sort((left, right) => left.path.localeCompare(right.path))
				.map(({ path, content }) => ({ path, content })),
		},
		null,
		2,
	);
	return [
		{ path: `${root}/.platform-spec-ledger.json`, content: `${ledger}\n` },
		...batch.edits
			.map((edit) => ({ path: `${root}/${edit.path}`, content: edit.content }))
			.sort((left, right) => left.path.localeCompare(right.path)),
	];
}

async function ensureBranch(
	octokit: Octokit,
	branch: string,
): Promise<void> {
	try {
		await octokit.git.getRef({ owner: owner(), repo: repo(), ref: `heads/${branch}` });
		return;
	} catch {
		const { data: base } = await octokit.repos.getBranch({
			owner: owner(),
			repo: repo(),
			branch: "main",
		});
		await octokit.git.createRef({
			owner: owner(),
			repo: repo(),
			ref: `refs/heads/${branch}`,
			sha: base.commit.sha,
		});
	}
}

async function assertWriteAccess(octokit: Octokit, login: string): Promise<void> {
	const { data } = await octokit.repos.getCollaboratorPermissionLevel({
		owner: owner(),
		repo: repo(),
		username: login,
	});
	if (!data.permission || !["admin", "maintain", "write"].includes(data.permission)) {
		throw new Error("GitHub write access is required");
	}
}

async function writeFiles(
	octokit: Octokit,
	branch: string,
	files: OpenSpecEdit[],
): Promise<void> {
	for (const file of files) {
		let sha: string | undefined;
		try {
			const existing = await octokit.repos.getContent({
				owner: owner(), repo: repo(), path: file.path, ref: branch,
			});
			if (!Array.isArray(existing.data) && existing.data.sha) sha = existing.data.sha;
		} catch {
			sha = undefined;
		}
		await octokit.repos.createOrUpdateFileContents({
			owner: owner(),
			repo: repo(),
			path: file.path,
			message: `spec: synchronize platform editor batch ${branch.split("/").at(-1)}`,
			content: Buffer.from(file.content, "utf8").toString("base64"),
			branch,
			sha,
		});
	}
}

export async function openOpenSpecEditPullRequest(
	input: OpenSpecEditBatch,
	octokit: Octokit,
): Promise<OpenSpecPullRequest> {
	assertBatch(input);
	const catalog = loadOpenSpecCatalog();
	if (input.sourceRevision !== catalog.revision) {
		throw new Error("catalog revision conflict");
	}
	const { data: authenticated } = await octokit.users.getAuthenticated();
	await assertWriteAccess(octokit, authenticated.login);
	const branch = branchFor(authenticated.login, input.batchId);
	const open = await octokit.pulls.list({
		owner: owner(), repo: repo(), state: "open", head: `${owner()}:${branch}`,
	});
	const existing = open.data[0];
	if (existing) {
		return {
			number: existing.number,
			url: existing.html_url,
			branch,
			reused: true,
			sourceRevision: input.sourceRevision,
		};
	}

	await ensureBranch(octokit, branch);
	await writeFiles(octokit, branch, serializedFiles(input));
	const { data: pr } = await octokit.pulls.create({
		owner: owner(),
		repo: repo(),
		title: `Platform Spec editor batch ${input.batchId}`,
		head: branch,
		base: "main",
		body: `OpenSpec editor batch \`${input.batchId}\` from catalog revision \`${input.sourceRevision}\`.`,
	});
	return {
		number: pr.number,
		url: pr.html_url,
		branch,
		reused: false,
		sourceRevision: input.sourceRevision,
	};
}

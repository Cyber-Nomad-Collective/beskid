import type { Octokit } from "@octokit/rest";
import "@tanstack/react-start/server-only";

import { env } from "#/env.server";
import { repoParams } from "#/lib/github/octokit";
import type { ParsedDraftContextBundle } from "#/server/memgraph/types";
import {
	loadOpenSpecCatalog,
	resolveOpenSpecRoot,
} from "#/server/openspec/reader";

const OWNER = () => env.GITHUB_REPO_OWNER;
const REPO = () => env.GITHUB_REPO_NAME;

function draftBranchName(contextId: string): string {
	const short = contextId.replace(/-/g, "").slice(0, 8);
	return `openspec/platform-editor-${short}`;
}

function changeName(contextId: string): string {
	return `platform-editor-${contextId.replace(/-/g, "").slice(0, 8)}`;
}

function assertPathContained(filePath: string): void {
	if (
		!filePath.startsWith("openspec/changes/") ||
		filePath.includes("..") ||
		pathIsAbsolute(filePath)
	) {
		throw new Error(`Refusing to write outside OpenSpec change tree: ${filePath}`);
	}
}

function pathIsAbsolute(filePath: string): boolean {
	return filePath.startsWith("/") || /^[A-Za-z]:[\\/]/.test(filePath);
}

function deltaBodyForChange(
	operation: "create" | "update" | "delete",
	sourceMarkdown: string,
	artifactKind: string,
): string {
	const supplied = sourceMarkdown.trim();
	if (!supplied && operation !== "delete") {
		throw new Error("Refusing to synthesize OpenSpec content from empty prose");
	}
	if (artifactKind === "feature") {
		if (operation !== "delete" && !/^### Requirement:/m.test(supplied)) {
			throw new Error(
				"Feature deltas require explicit ### Requirement: headings; synthesis is disabled",
			);
		}
		const opLabel =
			operation === "create"
				? "ADDED"
				: operation === "delete"
					? "REMOVED"
					: "MODIFIED";
		if (operation === "delete") {
			return `# Delta\n\n## ${opLabel} Requirements\n\n${supplied || "### Requirement: Removed\nThis requirement is removed by the approved OpenSpec change.\n"}`;
		}
		if (/^#\s+Delta\b/m.test(supplied) || /^##\s+(ADDED|MODIFIED|REMOVED)\b/m.test(supplied)) {
			return supplied.endsWith("\n") ? supplied : `${supplied}\n`;
		}
		return `# Delta\n\n## ${opLabel} Requirements\n\n${supplied}\n`;
	}
	return supplied.endsWith("\n") ? supplied : `${supplied}\n`;
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
			assertPathContained(file.path);
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
	bundle: ParsedDraftContextBundle,
	sourceRevision: string,
): Array<{
	path: string;
	content: string;
	message: string;
}> {
	const { context, documentChanges } = bundle;
	if (documentChanges.length === 0) {
		throw new Error("Cannot serialize an empty draft context");
	}
	for (const change of documentChanges) {
		if (!change.validation.ok && change.operation !== "delete") {
			const hard = change.validation.issues.some((issue) => issue.severity === "error");
			if (hard) {
				throw new Error(
					`Cannot serialize invalid document change ${change.canonicalPath}`,
				);
			}
		}
		if (
			change.identity.authority === "informative" &&
			change.artifactKind !== "article" &&
			change.artifactKind !== "decision"
		) {
			throw new Error("informative");
		}
	}

	const change = changeName(context.id);
	const root = `openspec/changes/${change}`;
	const whatChanges = documentChanges
		.map(
			(doc) =>
				`- ${doc.operation} \`${doc.identity.key}\` (${doc.artifactKind}) at \`${doc.canonicalPath}\``,
		)
		.join("\n");

	const files: Array<{ path: string; content: string; message: string }> = [
		{
			path: `${root}/.openspec.yaml`,
			content: "schema: spec-driven\n",
			message: `spec: initialize ${change}`,
		},
		{
			path: `${root}/proposal.md`,
			content: `# ${context.title}\n\n## Why\n\n${context.summary || "Proposed through the Beskid platform specification editor."}\n\n## What Changes\n\n${whatChanges}\n\n## Impact\n\n- Catalog revision pin: \`${context.baseCatalogRevision}\`\n`,
			message: `spec: propose ${change}`,
		},
		{
			path: `${root}/tasks.md`,
			content: `# Tasks\n\n- [ ] Validate the delta with \`openspec validate ${change} --strict\`.\n- [ ] Update implementation and conformance evidence.\n- [ ] Archive the change after verification.\n`,
			message: `spec: add tasks for ${change}`,
		},
	];

	for (const doc of documentChanges) {
		const relative = doc.canonicalPath.replace(/^openspec\//, "");
		const outPath =
			doc.artifactKind === "article" || doc.artifactKind === "decision"
				? `${root}/${relative}`
				: `${root}/specs/${doc.identity.capability}/spec.md`;
		files.push({
			path: outPath,
			content: deltaBodyForChange(
				doc.operation,
				doc.sourceMarkdown,
				doc.artifactKind,
			),
			message: `spec: ${doc.operation} ${doc.identity.key}`,
		});
	}

	const ledger = {
		draftId: context.id,
		sourceRevision,
		authorLogin: context.authorLogin,
		baseCatalogRevision: context.baseCatalogRevision,
		files: files
			.map(({ path, content }) => ({ path, content }))
			.sort((left, right) => left.path.localeCompare(right.path)),
	};

	const withLedger = [
		{
			path: `${root}/.platform-spec-ledger.json`,
			content: `${JSON.stringify(ledger, null, 2)}\n`,
			message: `spec: record ledger for ${change}`,
		},
		...files,
	];

	const sorted = withLedger
		.slice()
		.sort((left, right) => left.path.localeCompare(right.path));
	return sorted;
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
	bundle: ParsedDraftContextBundle,
	baseRef = "main",
	sourceRevision?: string,
): Promise<CreateDraftPrResult> {
	const catalog = loadOpenSpecCatalog(resolveOpenSpecRoot());
	const revision = sourceRevision ?? catalog.revision;
	if (revision !== catalog.revision) {
		throw new Error("catalog revision conflict");
	}
	if (bundle.context.baseCatalogRevision !== catalog.revision) {
		throw new Error("stale-base-revision");
	}

	const { data: authenticated } = await octokit.users.getAuthenticated();
	await assertWriteAccess(octokit, authenticated.login);

	const branch = bundle.context.headBranch ?? draftBranchName(bundle.context.id);
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
	if (bundle.context.prNumber && bundle.context.prUrl) {
		return {
			branch,
			prNumber: bundle.context.prNumber,
			prUrl: bundle.context.prUrl,
			reused: true,
			sourceRevision: revision,
		};
	}

	const baseCommitSha = await ensureBranch(octokit, baseRef, branch);
	const files = buildOpenSpecChangeFiles(bundle, revision);
	await writeFilesAtomically(
		octokit,
		branch,
		baseCommitSha,
		files.map(({ path, content }) => ({ path, content })),
		`spec: synchronize platform editor draft ${changeName(bundle.context.id)}`,
	);

	const prBody = [
		bundle.context.summary || bundle.context.title,
		"",
		"## Change",
		...bundle.documentChanges.map(
			(doc) =>
				`- **${doc.operation}** \`${doc.identity.key}\` (${doc.artifactKind})`,
		),
		"",
		`OpenSpec change: \`openspec/changes/${changeName(bundle.context.id)}/\`.`,
		"",
		`Catalog revision: \`${revision}\`.`,
		"",
		`_Opened from Beskid Platform Spec editor by @${bundle.context.authorLogin}._`,
	].join("\n");

	const { data: pr } = await octokit.pulls.create({
		...repoParams(),
		title: bundle.context.title,
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

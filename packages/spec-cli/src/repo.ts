import fs from "node:fs";
import path from "node:path";
import {
	normativePathsForSlug,
	parseWorkspaceManifest,
	validateWorkspace,
} from "@cyber-nomad-collective/spec-core";
import { loadCredentials } from "./auth.js";

export interface PushDraftOptions {
	workspaceDir: string;
	slug: string;
	branch?: string;
	title?: string;
	body?: string;
}

export interface PushDraftResult {
	prUrl: string;
	prNumber: number;
	branch: string;
}

async function githubRequest<T>(
	token: string,
	url: string,
	init?: RequestInit,
): Promise<T> {
	const response = await fetch(url, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "beskid-spec-cli",
			...(init?.headers ?? {}),
		},
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`GitHub API ${response.status}: ${text}`);
	}
	return (await response.json()) as T;
}

async function upsertFile(input: {
	token: string;
	owner: string;
	repo: string;
	branch: string;
	path: string;
	message: string;
	content: string;
}): Promise<void> {
	let sha: string | undefined;
	try {
		const existing = await githubRequest<{ sha: string }>(
			input.token,
			`https://api.github.com/repos/${input.owner}/${input.repo}/contents/${encodeURIComponent(input.path)}?ref=${encodeURIComponent(input.branch)}`,
		);
		sha = existing.sha;
	} catch {
		sha = undefined;
	}

	await githubRequest(
		input.token,
		`https://api.github.com/repos/${input.owner}/${input.repo}/contents/${encodeURIComponent(input.path)}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: input.message,
				content: Buffer.from(input.content, "utf8").toString("base64"),
				branch: input.branch,
				sha,
			}),
		},
	);
}

export async function pushNodePullRequest(
	options: PushDraftOptions,
): Promise<PushDraftResult> {
	const credentials = loadCredentials();
	if (!credentials) {
		throw new Error("Not authenticated. Run: spec auth login");
	}

	const report = validateWorkspace(options.workspaceDir);
	if (!report.ok) {
		throw new Error("Workspace validation failed; run spec validate");
	}

	const manifest = parseWorkspaceManifest(
		JSON.parse(
			fs.readFileSync(path.join(options.workspaceDir, "spec.json"), "utf8"),
		),
	);
	const github = manifest.github ?? {
		owner: "Cyber-Nomad-Collective",
		repo: "beskid_normative_spec",
		defaultBranch: "main",
	};

	const slug = options.slug.startsWith("platform-spec/")
		? options.slug
		: `platform-spec/${options.slug}`;
	const paths = normativePathsForSlug(slug);
	const branch =
		options.branch ??
		`spec/${slug.replace(/^platform-spec\/?/, "").replace(/\//g, "-") || "root"}`;

	const baseRef = github.defaultBranch;
	const base = await githubRequest<{ object: { sha: string } }>(
		credentials.token,
		`https://api.github.com/repos/${github.owner}/${github.repo}/git/ref/heads/${baseRef}`,
	);

	try {
		await githubRequest(
			credentials.token,
			`https://api.github.com/repos/${github.owner}/${github.repo}/git/refs`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ref: `refs/heads/${branch}`,
					sha: base.object.sha,
				}),
			},
		);
	} catch {
		// branch may already exist
	}

	const nodeDir = path.join(
		options.workspaceDir,
		manifest.contentRoot,
		slug.replace(/^platform-spec\/?/, ""),
	);
	const files = [
		{ repoPath: paths.nodeJson, localName: "node.json" },
		{ repoPath: paths.layoutJson, localName: "layout.json" },
		{ repoPath: paths.contentMd, localName: "content.md" },
		{ repoPath: paths.commentsJson, localName: "comments.json" },
	];

	for (const file of files) {
		const localPath = path.join(nodeDir, file.localName);
		if (!fs.existsSync(localPath)) continue;
		await upsertFile({
			token: credentials.token,
			owner: github.owner,
			repo: github.repo,
			branch,
			path: file.repoPath,
			message: `spec: update ${slug} (${file.localName})`,
			content: fs.readFileSync(localPath, "utf8"),
		});
	}

	const pr = await githubRequest<{ html_url: string; number: number }>(
		credentials.token,
		`https://api.github.com/repos/${github.owner}/${github.repo}/pulls`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: options.title ?? `spec: update ${slug}`,
				head: branch,
				base: baseRef,
				body:
					options.body ??
					`Proposed normative spec update for \`${slug}\`.\n\nOpened via \`spec repo push\`.`,
			}),
		},
	);

	return {
		prUrl: pr.html_url,
		prNumber: pr.number,
		branch,
	};
}

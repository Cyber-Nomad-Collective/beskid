import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import type { DraftChangeNode } from "#/server/memgraph/types";

process.env.AUTH_HUB_PUBLIC_URL ??= "https://auth.example.test";
process.env.SESSION_SECRET ??= "platform-spec-test-session-secret-32chars";
process.env.GITHUB_REPO_OWNER ??= "Cyber-Nomad-Collective";
process.env.GITHUB_REPO_NAME ??= "beskid";

const { buildOpenSpecChangeFiles, createDraftPullRequest } = await import("./pr");

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
	delete process.env.OPENSPEC_ROOT;
});

function fixtureCatalog(revision = "catalog-current"): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-git-sync-pr-"));
	roots.push(root);
	fs.writeFileSync(
		path.join(root, "catalog.json"),
		JSON.stringify({ version: 1, revision, entries: [] }),
	);
	return root;
}

function draft(): DraftChangeNode {
	return {
		id: "12345678-1234-1234-1234-123456789abc",
		title: "Define widget behavior",
		summary: "Make widget behavior normative.",
		changeKind: "create",
		repoPath: "",
		slug: "platform-spec/language/runtime/widgets",
		pathClass: "feature",
		specLevel: "feature",
		frontmatterJson: "{}",
		bodyMd: "Widgets SHALL remain deterministic.",
		layoutJson: null,
		status: "approved",
		authorLogin: "maintainer",
		moderatorLogin: "reviewer",
		rejectReason: null,
		headBranch: null,
		prNumber: null,
		prUrl: null,
		createdAt: "2026-07-13T00:00:00.000Z",
		updatedAt: "2026-07-13T00:00:00.000Z",
	};
}

function octokit(openPr?: { number: number; html_url: string }) {
	const pr = openPr ?? { number: 42, html_url: "https://example.test/pr/42" };
	return {
		users: { getAuthenticated: async () => ({ data: { login: "maintainer" } }) },
		repos: {
			getCollaboratorPermissionLevel: async () => ({ data: { permission: "write" } }),
			getBranch: async () => ({ data: { commit: { sha: "base-sha" } } }),
		},
		git: {
			getRef: async () => {
				throw Object.assign(new Error("not found"), { status: 404 });
			},
			createRef: async () => ({ data: {} }),
			getCommit: async () => ({ data: { tree: { sha: "base-tree" } } }),
			createBlob: async () => ({ data: { sha: "blob-sha" } }),
			createTree: async () => ({ data: { sha: "tree-sha" } }),
			createCommit: async () => ({ data: { sha: "commit-sha" } }),
			updateRef: async () => ({ data: {} }),
		},
		pulls: {
			list: async () => ({ data: openPr ? [pr] : [] }),
			create: async () => ({ data: pr }),
		},
	};
}

describe("OpenSpec draft pull request files", () => {
	it("writes ledger, proposal, tasks, and capability delta", () => {
		const files = buildOpenSpecChangeFiles(draft(), "catalog-current");
		expect(files.map((file) => file.path)).toEqual([
			"openspec/changes/platform-editor-12345678/.platform-spec-ledger.json",
			"openspec/changes/platform-editor-12345678/.openspec.yaml",
			"openspec/changes/platform-editor-12345678/proposal.md",
			"openspec/changes/platform-editor-12345678/tasks.md",
			"openspec/changes/platform-editor-12345678/specs/language--runtime--widgets/spec.md",
		]);
		expect(files[0]?.content).toContain('"sourceRevision": "catalog-current"');
		expect(files.map((file) => file.path).join("\n")).not.toMatch(
			/(node\.json|content\.md|layout\.json)/,
		);
		expect(files.at(-1)?.content).toContain("## ADDED Requirements");
		expect(files.at(-1)?.content).toContain("#### Scenario:");
	});
});

describe("OpenSpec draft pull request sync", () => {
	it("reuses an open pull request for an identical editor draft", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		await expect(
			createDraftPullRequest(
				octokit({ number: 42, html_url: "https://example.test/pr/42" }) as never,
				draft(),
			),
		).resolves.toMatchObject({ prNumber: 42, reused: true });
	});

	it("rejects a stale catalog revision", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		await expect(
			createDraftPullRequest(octokit() as never, draft(), "main", "old"),
		).rejects.toThrow("catalog revision conflict");
	});

	it("commits every editor file atomically through the Git Database API", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		const client = octokit();
		const calls: Array<{ method: string; input: Record<string, unknown> }> = [];
		client.git.getRef = async (input?: Record<string, unknown>) => {
			calls.push({ method: "getRef", input: input ?? {} });
			throw Object.assign(new Error("not found"), { status: 404 });
		};
		client.git.createRef = async (input?: Record<string, unknown>) => {
			calls.push({ method: "createRef", input: input ?? {} });
			return { data: {} };
		};
		client.git.getCommit = async (input?: Record<string, unknown>) => {
			calls.push({ method: "getCommit", input: input ?? {} });
			return { data: { tree: { sha: "base-tree" } } };
		};
		let blobNumber = 0;
		client.git.createBlob = async (input?: Record<string, unknown>) => {
			calls.push({ method: "createBlob", input: input ?? {} });
			blobNumber += 1;
			return { data: { sha: `blob-${blobNumber}` } };
		};
		client.git.createTree = async (input?: Record<string, unknown>) => {
			calls.push({ method: "createTree", input: input ?? {} });
			return { data: { sha: "tree-sha" } };
		};
		client.git.createCommit = async (input?: Record<string, unknown>) => {
			calls.push({ method: "createCommit", input: input ?? {} });
			return { data: { sha: "commit-sha" } };
		};
		client.git.updateRef = async (input?: Record<string, unknown>) => {
			calls.push({ method: "updateRef", input: input ?? {} });
			return { data: {} };
		};

		await expect(createDraftPullRequest(client as never, draft())).resolves.toMatchObject({
			reused: false,
			sourceRevision: "catalog-current",
		});

		expect(calls.map(({ method }) => method)).toEqual([
			"getRef",
			"createRef",
			"getCommit",
			"createBlob",
			"createBlob",
			"createBlob",
			"createBlob",
			"createBlob",
			"createTree",
			"createCommit",
			"updateRef",
		]);
		expect(calls.find(({ method }) => method === "createTree")?.input).toMatchObject({
			base_tree: "base-tree",
			tree: expect.arrayContaining([
				expect.objectContaining({
					path: "openspec/changes/platform-editor-12345678/.platform-spec-ledger.json",
				}),
				expect.objectContaining({
					path: "openspec/changes/platform-editor-12345678/proposal.md",
				}),
			]),
		});
	});

	it("rethrows a non-404 branch lookup error", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		const client = octokit();
		client.git.getRef = async () => {
			throw Object.assign(new Error("GitHub unavailable"), { status: 500 });
		};

		await expect(createDraftPullRequest(client as never, draft())).rejects.toThrow(
			"GitHub unavailable",
		);
	});
});

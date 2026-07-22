import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
	openOpenSpecEditPullRequest,
	type OpenSpecEditBatch,
} from "./pr-sync";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
	delete process.env.OPENSPEC_ROOT;
});

function fixtureCatalog(): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-pr-sync-"));
	roots.push(root);
	fs.writeFileSync(
		path.join(root, "catalog.json"),
		JSON.stringify({ version: 1, revision: "catalog-current", entries: [] }),
	);
	return root;
}

function fixtureBatch(): OpenSpecEditBatch {
	return {
		batchId: "batch-123",
		sourceRevision: "catalog-current",
		edits: [{ path: "proposal.md", content: "# Proposal\n" }],
	};
}

function octokit() {
	let pr = { number: 42, html_url: "https://example.test/pr/42" };
	return {
		users: { getAuthenticated: async () => ({ data: { login: "editor" } }) },
		repos: {
			getCollaboratorPermissionLevel: async () => ({ data: { permission: "write" } }),
			getBranch: async () => ({ data: { commit: { sha: "base-sha" } } }),
			getContent: async () => {
				throw new Error("not found");
			},
			createOrUpdateFileContents: async () => ({ data: {} }),
		},
		git: {
			getRef: async () => {
				throw new Error("not found");
			},
			createRef: async () => ({ data: {} }),
			getCommit: async () => ({ data: { tree: { sha: "base-tree" } } }),
			createBlob: async () => ({ data: { sha: "blob-sha" } }),
			createTree: async () => ({ data: { sha: "tree-sha" } }),
			createCommit: async () => ({ data: { sha: "commit-sha" } }),
			updateRef: async () => ({ data: {} }),
		},
		pulls: {
			list: async () => ({ data: [pr] }),
			create: async () => ({ data: pr }),
		},
	};
}

describe("OpenSpec edit pull request sync", () => {
	it("reuses an open pull request for an identical editor batch", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		await expect(
			openOpenSpecEditPullRequest(fixtureBatch(), octokit() as never),
		).resolves.toMatchObject({ number: 42, reused: true });
	});

	it("rejects a stale catalog revision", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		await expect(
			openOpenSpecEditPullRequest(
				{ ...fixtureBatch(), sourceRevision: "old" },
				octokit() as never,
			),
		).rejects.toThrow("catalog revision conflict");
	});

	it("commits every editor file atomically through the Git Database API", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		const client = octokit();
		const calls: Array<{ method: string; input: Record<string, unknown> }> = [];
		client.pulls.list = async () => ({ data: [] });
		client.repos.createOrUpdateFileContents = async () => {
			throw new Error("legacy per-file write used");
		};
		client.git.getRef = async (input: Record<string, unknown> = {}) => {
			calls.push({ method: "getRef", input });
			throw Object.assign(new Error("not found"), { status: 404 });
		};
		client.git.createRef = async (input: Record<string, unknown> = {}) => {
			calls.push({ method: "createRef", input });
			return { data: {} };
		};
		client.git.getCommit = async (input: Record<string, unknown> = {}) => {
			calls.push({ method: "getCommit", input });
			return { data: { tree: { sha: "base-tree" } } };
		};
		let blobNumber = 0;
		client.git.createBlob = async (input: Record<string, unknown> = {}) => {
			calls.push({ method: "createBlob", input });
			blobNumber += 1;
			return { data: { sha: `blob-${blobNumber}` } };
		};
		client.git.createTree = async (input: Record<string, unknown> = {}) => {
			calls.push({ method: "createTree", input });
			return { data: { sha: "tree-sha" } };
		};
		client.git.createCommit = async (input: Record<string, unknown> = {}) => {
			calls.push({ method: "createCommit", input });
			return { data: { sha: "commit-sha" } };
		};
		client.git.updateRef = async (input: Record<string, unknown> = {}) => {
			calls.push({ method: "updateRef", input });
			return { data: {} };
		};

		await expect(openOpenSpecEditPullRequest(fixtureBatch(), client as never)).resolves.toMatchObject({
			reused: false,
		});

		expect(calls.map(({ method }) => method)).toEqual([
			"getRef", "createRef", "getCommit", "createBlob", "createBlob", "createTree", "createCommit", "updateRef",
		]);
		expect(calls.find(({ method }) => method === "createTree")?.input).toMatchObject({
			base_tree: "base-tree",
			tree: expect.arrayContaining([
				expect.objectContaining({ path: "openspec/changes/platform-spec-batch-123/.platform-spec-ledger.json" }),
				expect.objectContaining({ path: "openspec/changes/platform-spec-batch-123/proposal.md" }),
			]),
		});
	});

	it("rethrows a non-404 branch lookup error", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		const client = octokit();
		client.pulls.list = async () => ({ data: [] });
		client.git.getRef = async () => {
			throw Object.assign(new Error("GitHub unavailable"), { status: 500 });
		};

		await expect(openOpenSpecEditPullRequest(fixtureBatch(), client as never)).rejects.toThrow("GitHub unavailable");
	});

	it("rejects backslash-separated traversal paths", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog();
		await expect(
			openOpenSpecEditPullRequest(
				{ ...fixtureBatch(), edits: [{ path: "draft\\..\\private.md", content: "secret" }] },
				octokit() as never,
			),
		).rejects.toThrow("edit path must be relative to the OpenSpec change");
	});
});

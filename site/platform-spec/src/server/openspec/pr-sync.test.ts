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
});

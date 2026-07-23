import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { resolveDocumentIdentity } from "#/lib/spec/document-identity";
import type { ParsedDraftContextBundle } from "#/server/memgraph/types";

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
		JSON.stringify({ version: 1, revision, entries: [], documents: [] }),
	);
	return root;
}

function featureBody(): string {
	return `# Widgets

## Purpose

Widget behavior.

## Requirements

### Requirement: Deterministic widgets

Widgets SHALL remain deterministic.

#### Scenario: Review widgets change

- **GIVEN** the proposed widgets change
- **WHEN** maintainers validate and merge the OpenSpec change
- **THEN** the canonical capability specification reflects the approved behavior
`;
}

function bundle(): ParsedDraftContextBundle {
	const identity = resolveDocumentIdentity({
		kind: "feature",
		domain: "language",
		area: "runtime",
		feature: "widgets",
	});
	return {
		context: {
			id: "12345678-1234-1234-1234-123456789abc",
			title: "Define widget behavior",
			summary: "Make widget behavior normative.",
			baseCatalogRevision: "catalog-current",
			status: "submitted",
			authorLogin: "maintainer",
			moderatorLogin: null,
			rejectReason: null,
			validationState: "valid",
			validationRevision: "catalog-current",
			headBranch: null,
			prNumber: null,
			prUrl: null,
			trackerTaskIdsJson: "[]",
			deliveryVersionId: null,
			createdAt: "2026-07-13T00:00:00.000Z",
			updatedAt: "2026-07-13T00:00:00.000Z",
		},
		documentChanges: [
			{
				id: "doc-1",
				contextId: "12345678-1234-1234-1234-123456789abc",
				ordinal: 0,
				operation: "create",
				artifactKind: "feature",
				canonicalPath: identity.canonicalPath,
				publicSlug: identity.publicSlug,
				layoutId: "feature",
				sourceMarkdown: featureBody(),
				baseMarkdown: null,
				baseContentHash: null,
				contentHash: "abc",
				moderatorNote: null,
				createdAt: "2026-07-13T00:00:00.000Z",
				updatedAt: "2026-07-13T00:00:00.000Z",
				identity,
				validation: { ok: true, issues: [] },
			},
		],
		revisions: [],
		trackerTaskIds: [],
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
		const files = buildOpenSpecChangeFiles(bundle(), "catalog-current");
		expect(files.map((file) => file.path)).toEqual(
			[...files.map((file) => file.path)].sort(),
		);
		expect(files.map((file) => file.path)).toEqual(
			expect.arrayContaining([
				"openspec/changes/platform-editor-12345678/.platform-spec-ledger.json",
				"openspec/changes/platform-editor-12345678/.openspec.yaml",
				"openspec/changes/platform-editor-12345678/proposal.md",
				"openspec/changes/platform-editor-12345678/tasks.md",
				"openspec/changes/platform-editor-12345678/specs/language--runtime--widgets/spec.md",
			]),
		);
		expect(files.find((f) => f.path.endsWith("ledger.json"))?.content).toContain(
			'"sourceRevision": "catalog-current"',
		);
		expect(files.map((file) => file.path).join("\n")).not.toMatch(
			/(node\.json|content\.md|layout\.json)/,
		);
		expect(
			files.find((f) => f.path.endsWith("widgets/spec.md"))?.content,
		).toContain("## ADDED Requirements");
		expect(
			files.find((f) => f.path.endsWith("widgets/spec.md"))?.content,
		).toContain("#### Scenario:");
	});

	it("refuses to synthesize missing feature requirements", () => {
		const bad = bundle();
		bad.documentChanges[0]!.sourceMarkdown = "just prose";
		expect(() => buildOpenSpecChangeFiles(bad, "catalog-current")).toThrow(
			/synthesis is disabled/,
		);
	});
});

describe("createDraftPullRequest", () => {
	it("rejects catalog revision conflicts", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog("catalog-current");
		await expect(
			createDraftPullRequest(
				octokit() as never,
				bundle(),
				"main",
				"old",
			),
		).rejects.toThrow("catalog revision conflict");
	});

	it("reuses an open pull request", async () => {
		process.env.OPENSPEC_ROOT = fixtureCatalog("catalog-current");
		await expect(
			createDraftPullRequest(
				octokit({
					number: 7,
					html_url: "https://example.test/pr/7",
				}) as never,
				bundle(),
			),
		).resolves.toMatchObject({
			prNumber: 7,
			reused: true,
		});
	});
});

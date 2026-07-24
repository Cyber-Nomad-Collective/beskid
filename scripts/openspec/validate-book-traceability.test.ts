import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateBookTraceability } from "./validate-book-traceability.ts";

type Catalog = Parameters<typeof validateBookTraceability>[0]["catalog"];

const capabilityPath =
	"/platform-spec/capabilities/language-meta--surface-syntax--documentation-comments/";

function catalogFor(documents: Catalog["documents"]): Catalog {
	return {
		entries: [
			{
				capability: "language-meta--surface-syntax--documentation-comments",
				path: capabilityPath,
				bookLinks: [],
			},
		],
		documents,
	};
}

function withBook(
	files: Record<string, string>,
	run: (bookRoot: string) => void,
): void {
	const root = mkdtempSync(path.join(os.tmpdir(), "beskid-book-traceability-"));
	try {
		for (const [relativePath, content] of Object.entries(files)) {
			const file = path.join(root, relativePath);
			mkdirSync(path.dirname(file), { recursive: true });
			writeFileSync(file, content);
		}
		run(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

test("accepts canonical standard links and derives sorted reciprocal Book routes", () => {
	withBook(
		{
			"20-doc-comments-that-are-not-lies/z-guide.md": "# Z guide\n",
			"20-doc-comments-that-are-not-lies/a-guide.md": "# A guide\n",
		},
		(bookRoot) => {
			const result = validateBookTraceability({
				catalog: catalogFor([
					{
						path:
							"site/website/src/content/docs/book/20-doc-comments-that-are-not-lies/z-guide.md",
						standardLinks: [capabilityPath],
					},
					{
						path:
							"site/website/src/content/docs/book/20-doc-comments-that-are-not-lies/a-guide.md",
						standardLinks: [capabilityPath],
					},
				]),
				bookRoot,
			});

			assert.deepEqual(result.errors, []);
			assert.deepEqual(result.bookLinksByCapability, {
				"language-meta--surface-syntax--documentation-comments": [
					"/book/20-doc-comments-that-are-not-lies/a-guide/",
					"/book/20-doc-comments-that-are-not-lies/z-guide/",
				],
			});
		},
	);
});

test("derives a public Book route from a catalog document path", () => {
	withBook(
		{ "13-reading-the-law/platform-spec-home.md": "# Platform spec home\n" },
		(bookRoot) => {
			const result = validateBookTraceability({
				catalog: catalogFor([
					{
						path:
							"site/website/src/content/docs/book/13-reading-the-law/platform-spec-home.md",
						standardLinks: [capabilityPath],
					},
				]),
				bookRoot,
			});

			assert.deepEqual(
				result.bookLinksByCapability[
					"language-meta--surface-syntax--documentation-comments"
				],
				["/book/13-reading-the-law/platform-spec-home/"],
			);
		},
	);
});

test("reports an uncovered technical Book document", () => {
	withBook(
		{ "20-doc-comments-that-are-not-lies/technical.md": "# Technical guide\n" },
		(bookRoot) => {
			const result = validateBookTraceability({
				catalog: catalogFor([
					{
						path:
							"site/website/src/content/docs/book/20-doc-comments-that-are-not-lies/technical.md",
						standardLinks: [],
					},
				]),
				bookRoot,
			});

			assert.deepEqual(result.errors, [
				"Technical Book document lacks a resolvable canonical standard link: site/website/src/content/docs/book/20-doc-comments-that-are-not-lies/technical.md",
			]);
		},
	);
});

test("allows a Book document explicitly declared as narrative", () => {
	withBook(
		{
			"20-doc-comments-that-are-not-lies/narrative.md":
				"---\nstandardTraceability: narrative\n---\n\n# Personal context\n",
		},
		(bookRoot) => {
			const result = validateBookTraceability({
				catalog: catalogFor([
					{
						path:
							"site/website/src/content/docs/book/20-doc-comments-that-are-not-lies/narrative.md",
						standardLinks: [],
					},
				]),
				bookRoot,
			});

			assert.deepEqual(result.errors, []);
		},
	);
});

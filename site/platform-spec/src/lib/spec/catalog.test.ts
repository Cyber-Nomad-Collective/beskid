import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadOpenSpecCatalog } from "#/lib/spec/catalog";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

function write(root: string, relativePath: string, body: string): void {
	const target = path.join(root, relativePath);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, body);
}

function fixture(): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-catalog-"));
	roots.push(root);
	const specs = [
		["taxonomy--compiler", "# Compiler\n\n## Purpose\n\nCompiler taxonomy.\n"],
		[
			"taxonomy--compiler--front-end",
			"# Front end\n\n## Purpose\n\nFront-end taxonomy.\n",
		],
		[
			"compiler--front-end--parser",
			"# Parser\n\n## Purpose\n\nParser contract.\n\n## Requirements\n\n### Requirement: Parse source\n\nThe parser parses source.\n",
		],
	] as const;
	for (const [capability, body] of specs) {
		write(root, `specs/${capability}/spec.md`, body);
	}
	write(
		root,
		"documents/platform-spec/compiler--front-end--parser/articles/grammar-notes.md",
		"# Grammar notes\n\n## Purpose\n\nExplain grammar choices.\n",
	);
	write(
		root,
		"documents/platform-spec/compiler--front-end--parser/decisions/0001-parser-shape.md",
		"# Parser shape\n\n## Context\n\nShape context.\n\n## Decision\n\nUse one parser shape.\n\n## Consequences\n\nOne representation.\n",
	);
	write(
		root,
		"catalog.json",
		JSON.stringify({
			version: 1,
			revision: "fixture-revision",
			entries: specs.map(([capability]) => ({
				id: capability,
				capability,
				specPath: `openspec/specs/${capability}/spec.md`,
				status: capability.startsWith("taxonomy--")
					? "Proposed"
					: "Standard",
			})),
		}),
	);
	return root;
}

describe("canonical OpenSpec catalog", () => {
	it("normalizes taxonomy, features, articles, and decisions into one list", () => {
		const root = fixture();
		const catalog = loadOpenSpecCatalog(root);

		expect(catalog.documents.map((document) => document.kind)).toEqual([
			"taxonomy-domain",
			"taxonomy-area",
			"feature",
			"article",
			"decision",
		]);
		expect(catalog.entries).toBe(catalog.documents);

		const area = catalog.documents.find(
			(document) => document.kind === "taxonomy-area",
		);
		expect(area).toMatchObject({
			canonicalPath:
				"openspec/specs/taxonomy--compiler--front-end/spec.md",
			parentCapability: "taxonomy--compiler",
			layout: "_default",
			authority: "normative",
			disposition: "provisional-taxonomy",
		});

		const article = catalog.documents.find(
			(document) => document.kind === "article",
		);
		expect(article).toMatchObject({
			capability: "compiler--front-end--parser",
			parentCapability: "compiler--front-end--parser",
			layout: "article",
			authority: "informative",
			disposition: "informative-by-policy",
			title: "Grammar notes",
		});
		if (!article) throw new Error("Expected the article fixture in the catalog");
		expect(article?.sourceHash).toBe(
			createHash("sha256")
				.update(
					fs.readFileSync(
						path.join(root, article.canonicalPath.replace(/^openspec\//, "")),
						"utf8",
					),
				)
				.digest("hex"),
		);
	});

	it("rejects known taxonomy levels at non-canonical paths", () => {
		const root = fixture();
		write(
			root,
			"specs/compiler--front-end/spec.md",
			"# Front end\n\n## Purpose\n\nWrong path.\n",
		);
		const catalogPath = path.join(root, "catalog.json");
		const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
		raw.entries.push({
			id: "compiler--front-end",
			capability: "compiler--front-end",
			specPath: "openspec/specs/compiler--front-end/spec.md",
			specLevel: "area",
		});
		fs.writeFileSync(catalogPath, JSON.stringify(raw));

		expect(() => loadOpenSpecCatalog(root)).toThrow(
			"area artifact must use taxonomy--<domain>--<area>",
		);
	});

	it("rejects informative documents whose feature parent does not exist", () => {
		const root = fixture();
		write(
			root,
			"documents/platform-spec/compiler--front-end--missing/articles/orphan.md",
			"# Orphan\n",
		);

		expect(() => loadOpenSpecCatalog(root)).toThrow(
			"Missing feature parent compiler--front-end--missing",
		);
	});
});

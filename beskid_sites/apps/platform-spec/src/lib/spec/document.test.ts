import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { getOpenSpecDocument } from "#/lib/spec/document";

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
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-document-"));
	roots.push(root);
	for (const [capability, title] of [
		["taxonomy--compiler", "Compiler"],
		["taxonomy--compiler--front-end", "Front end"],
		["compiler--front-end--parser", "Parser"],
	]) {
		write(
			root,
			`specs/${capability}/spec.md`,
			`# ${title}\n\n## Purpose\n\n${title} purpose.\n\n## Requirements\n\n### Requirement: ${title} status\n\nStatus.\n`,
		);
	}
	write(
		root,
		"documents/platform-spec/compiler--front-end--parser/articles/grammar-notes.md",
		"# Grammar notes\n\n## Purpose\n\nExplain grammar.\n",
	);
	write(
		root,
		"layouts/index.json",
		JSON.stringify({
			version: 1,
			default: "_default",
			bySpecLevel: {
				domain: "_default",
				area: "_default",
				feature: "feature",
				article: "article",
			},
		}),
	);
	for (const id of ["_default", "feature", "article"]) {
		write(
			root,
			`layouts/${id}.json`,
			JSON.stringify({ id, specLevel: id, title: id, sections: [] }),
		);
	}
	write(
		root,
		"catalog.json",
		JSON.stringify({
			revision: "document-revision",
			entries: [
				"taxonomy--compiler",
				"taxonomy--compiler--front-end",
				"compiler--front-end--parser",
			].map((capability) => ({
				id: capability,
				capability,
				specPath: `openspec/specs/${capability}/spec.md`,
			})),
		}),
	);
	return root;
}

describe("OpenSpec document bundles", () => {
	it("renders a taxonomy domain at its canonical domain route", () => {
		const document = getOpenSpecDocument(
			"platform-spec/domains/compiler",
			fixture(),
		);

		expect(document).toMatchObject({
			kind: "taxonomy-domain",
			slug: "platform-spec/domains/compiler",
			canonicalPath: "openspec/specs/taxonomy--compiler/spec.md",
			authority: "normative",
			disposition: "provisional-taxonomy",
		});
		expect(document?.body).toContain("# Compiler");
	});

	it("keeps the existing feature capability URL stable", () => {
		const document = getOpenSpecDocument(
			"platform-spec/capabilities/compiler--front-end--parser",
			fixture(),
		);

		expect(document).toMatchObject({
			kind: "feature",
			href: "/platform-spec/capabilities/compiler--front-end--parser/",
		});
	});

	it("renders informative articles with their article layout", () => {
		const document = getOpenSpecDocument(
			"platform-spec/capabilities/compiler--front-end--parser/articles/grammar-notes",
			fixture(),
		);

		expect(document).toMatchObject({
			kind: "article",
			parentCapability: "compiler--front-end--parser",
			authority: "informative",
			layout: { id: "article" },
			frontmatter: {
				kind: "article",
				authority: "informative",
			},
		});
		expect(document?.body).toContain("Explain grammar.");
	});
});

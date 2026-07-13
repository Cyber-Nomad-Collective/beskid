import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
	extractRequirements,
	getOpenSpecDocument,
	getOpenSpecEmbed,
	loadOpenSpecCatalog,
	resolveOpenSpecEntry,
	resolveOpenSpecRoot,
} from "./reader";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0))
		fs.rmSync(root, { recursive: true, force: true });
});

function fixture(): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "beskid-openspec-"));
	roots.push(root);
	fs.mkdirSync(path.join(root, "specs", "language--syntax--blocks"), {
		recursive: true,
	});
	fs.writeFileSync(
		path.join(root, "specs", "language--syntax--blocks", "spec.md"),
		"# Blocks\n\n## Purpose\n\nDefines blocks.\n\n## Requirements\n\n### Requirement: Block delimiter\nBlocks use braces.\n\n#### Scenario: Parse a block\n- **WHEN** braces are balanced\n- **THEN** parsing succeeds\n",
	);
	fs.writeFileSync(
		path.join(root, "catalog.json"),
		JSON.stringify({
			version: 1,
			revision: "abc123",
			aliases: {
				"platform-spec/language/syntax/blocks": "language--syntax--blocks",
			},
			entries: [
				{
					id: "language--syntax--blocks",
					title: "Block syntax",
					specPath: "specs/language--syntax--blocks/spec.md",
					path: "/platform-spec/capabilities/language--syntax--blocks/",
					bookLinks: [
						"/book/07-compiler-is-not-your-therapist/lexical-basics/",
					],
					requirements: [
						{ id: "BSP-REQ-BLOCK", anchor: "requirement-block-delimiter" },
					],
				},
			],
		}),
	);
	return root;
}

describe("OpenSpec reader", () => {
	it("loads catalog entries and legacy aliases", () => {
		const root = fixture();
		expect(loadOpenSpecCatalog(root).revision).toBe("abc123");
		expect(
			resolveOpenSpecEntry("platform-spec/language/syntax/blocks", root)?.id,
		).toBe("language--syntax--blocks");
		expect(loadOpenSpecCatalog(root).entries[0]?.href).toBe(
			"/platform-spec/capabilities/language--syntax--blocks/",
		);
	});

	it("reads canonical content and requirement embeds", () => {
		const root = fixture();
		expect(
			getOpenSpecDocument("language--syntax--blocks", root)?.body,
		).toContain("### Requirement: Block delimiter");
		expect(
			getOpenSpecEmbed("language--syntax--blocks#block-delimiter", root)
				?.markdown,
		).toContain("#### Scenario: Parse a block");
		expect(
			getOpenSpecEmbed("language--syntax--blocks#BSP-REQ-BLOCK", root)
				?.markdown,
		).toContain("#### Scenario: Parse a block");
	});

	it("exposes catalog-derived informative Book guides with a document", () => {
		const root = fixture();
		const expectedBookLinks = [
			"/book/07-compiler-is-not-your-therapist/lexical-basics/",
		];

		expect(loadOpenSpecCatalog(root).entries[0]?.bookLinks).toEqual(
			expectedBookLinks,
		);
		expect(getOpenSpecDocument("language--syntax--blocks", root)?.bookLinks).toEqual(
			expectedBookLinks,
		);
	});

	it("extracts stable requirement anchors", () => {
		expect(extractRequirements("### Requirement: Hello, World!\nText")).toEqual(
			[
				{
					id: "hello-world",
					anchor: "hello-world",
					title: "Hello, World!",
					markdown: "### Requirement: Hello, World!\nText",
				},
			],
		);
	});

	it("reads the repository's generated OpenSpec catalog and stable aliases", () => {
		const root = resolveOpenSpecRoot();
		const catalog = loadOpenSpecCatalog(root);
		expect(catalog.entries.length).toBeGreaterThanOrEqual(179);
		const aliased = catalog.entries.find(
			(entry) => entry.legacySlugs.length > 0,
		);
		if (!aliased) throw new Error("expected at least one catalog alias");
		const legacySlug = aliased.legacySlugs[0];
		if (!legacySlug) throw new Error("expected a legacy slug");
		expect(resolveOpenSpecEntry(legacySlug, root)?.id).toBe(aliased.id);
		expect(aliased.href).toBe(
			`/platform-spec/capabilities/${aliased.capability}/`,
		);
		const requirement = aliased.requirements[0];
		if (requirement) {
			expect(
				getOpenSpecEmbed(`${aliased.capability}#${requirement.id}`, root)
					?.requirement?.id,
			).toBe(requirement.id);
		}
	});
});

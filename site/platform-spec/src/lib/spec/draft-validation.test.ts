import { describe, expect, it } from "vitest";

import { resolveDocumentIdentity } from "#/lib/spec/document-identity";
import {
	layoutTemplateMarkdown,
	validateDraftContext,
	validateDraftDocument,
} from "#/lib/spec/draft-validation";
import type { LayoutRegistry } from "#/lib/spec/layouts";

const featureIdentity = resolveDocumentIdentity({
	kind: "feature",
	domain: "compiler",
	area: "front-end",
	feature: "parser",
});

const featureBody = `# Parser

## Purpose

Parser front-end.

## Requirements

### Requirement: Parse source

The parser SHALL accept valid programs.

#### Scenario: Valid input

- **GIVEN** valid source
- **WHEN** the parser runs
- **THEN** an AST is produced
`;

function layouts(): LayoutRegistry {
	return {
		index: {
			version: 1,
			default: "_default",
			bySpecLevel: { feature: "feature" },
		},
		layouts: new Map([
			[
				"feature",
				{
					id: "feature",
					specLevel: "feature",
					title: "Feature",
					requireTitle: true,
					sections: [
						{ heading: "Purpose", level: 2, required: true },
						{
							heading: "Requirements",
							level: 2,
							required: true,
							mustContainPattern: "^### Requirement:\\s+\\S",
						},
					],
				},
			],
		]),
	};
}

describe("draft-validation", () => {
	it("rejects feature documents without scenarios", () => {
		const result = validateDraftDocument(
			{
				id: "doc-1",
				operation: "create",
				identity: featureIdentity,
				canonicalPath: featureIdentity.canonicalPath,
				sourceMarkdown: `# Parser\n\n## Purpose\n\nx\n\n## Requirements\n\n### Requirement: Parse\n\nSHALL parse.\n`,
				baseMarkdown: null,
				baseContentHash: null,
				layoutId: "feature",
			},
			{ revision: "r1", paths: new Set(), slugs: new Set() },
			layouts(),
		);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: "missing-scenario" }),
			]),
		);
	});

	it("accepts a complete feature create", () => {
		const result = validateDraftDocument(
			{
				id: "doc-1",
				operation: "create",
				identity: featureIdentity,
				canonicalPath: featureIdentity.canonicalPath,
				sourceMarkdown: featureBody,
				baseMarkdown: null,
				baseContentHash: null,
				layoutId: "feature",
			},
			{ revision: "r1", paths: new Set(), slugs: new Set() },
			layouts(),
		);
		expect(result.ok).toBe(true);
	});

	it("flags stale base catalog revision on the context", () => {
		const result = validateDraftContext(
			[
				{
					id: "doc-1",
					contextId: "ctx",
					ordinal: 0,
					operation: "create",
					artifactKind: "feature",
					canonicalPath: featureIdentity.canonicalPath,
					publicSlug: featureIdentity.publicSlug,
					layoutId: "feature",
					sourceMarkdown: featureBody,
					baseMarkdown: null,
					baseContentHash: null,
					contentHash: "abc",
					moderatorNote: null,
					createdAt: "",
					updatedAt: "",
					identity: featureIdentity,
					validation: { ok: true, issues: [] },
				},
			],
			{ revision: "current", paths: new Set(), slugs: new Set() },
			layouts(),
			"old",
		);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: "stale-base-revision" }),
			]),
		);
	});

	it("seeds layout templates with requirement scaffolding", () => {
		const md = layoutTemplateMarkdown(
			layouts().layouts.get("feature")!,
		);
		expect(md).toContain("## Purpose");
		expect(md).toContain("### Requirement:");
		expect(md).toContain("**GIVEN**");
	});
});

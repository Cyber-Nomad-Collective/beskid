import { describe, expect, it } from "vitest";

import {
	resolveDocumentIdentity,
	resolveDocumentIdentityFromPath,
} from "#/lib/spec/document-identity";

describe("resolveDocumentIdentity", () => {
	it("resolves the canonical taxonomy domain identity", () => {
		expect(
			resolveDocumentIdentity({ kind: "domain", domain: "compiler" }),
		).toMatchObject({
			kind: "taxonomy-domain",
			canonicalPath: "openspec/specs/taxonomy--compiler/spec.md",
			publicSlug: "platform-spec/domains/compiler",
			parentCapability: "platform-spec",
			authority: "normative",
			disposition: "provisional-taxonomy",
		});
	});

	it("resolves the canonical taxonomy area identity", () => {
		expect(
			resolveDocumentIdentity({
				kind: "area",
				domain: "compiler",
				area: "front-end",
			}),
		).toMatchObject({
			kind: "taxonomy-area",
			canonicalPath:
				"openspec/specs/taxonomy--compiler--front-end/spec.md",
			publicSlug: "platform-spec/domains/compiler/areas/front-end",
			parentCapability: "taxonomy--compiler",
			layout: "_default",
		});
	});

	it("preserves the existing capability URL for a feature", () => {
		expect(
			resolveDocumentIdentity({
				kind: "feature",
				domain: "compiler",
				area: "front-end",
				feature: "parser",
			}),
		).toMatchObject({
			kind: "feature",
			canonicalPath: "openspec/specs/compiler--front-end--parser/spec.md",
			publicSlug: "platform-spec/capabilities/compiler--front-end--parser",
			parentCapability: "taxonomy--compiler--front-end",
			authority: "normative",
		});
	});

	it("resolves informative feature-owned articles", () => {
		expect(
			resolveDocumentIdentity({
				kind: "article",
				domain: "compiler",
				area: "front-end",
				feature: "parser",
				article: "grammar-notes",
			}),
		).toMatchObject({
			kind: "article",
			canonicalPath:
				"openspec/documents/platform-spec/compiler--front-end--parser/articles/grammar-notes.md",
			parentCapability: "compiler--front-end--parser",
			authority: "informative",
			disposition: "informative-by-policy",
			layout: "article",
		});
	});

	it("resolves informative feature-owned decisions", () => {
		expect(
			resolveDocumentIdentity({
				kind: "decision",
				domain: "compiler",
				area: "front-end",
				feature: "parser",
				decision: "0001-parser-shape",
			}),
		).toMatchObject({
			kind: "decision",
			canonicalPath:
				"openspec/documents/platform-spec/compiler--front-end--parser/decisions/0001-parser-shape.md",
			parentCapability: "compiler--front-end--parser",
			authority: "informative",
			layout: "adr",
		});
	});

	it.each([
		{ kind: "feature", domain: "../escape" },
		{ kind: "area", domain: "compiler", area: "Front End" },
		{
			kind: "article",
			domain: "compiler",
			area: "front-end",
			feature: "parser",
			article: "nested/path",
		},
		{
			kind: "decision",
			domain: "compiler",
			area: "front-end",
			feature: "parser",
			decision: "parser-shape",
		},
		{ kind: "unknown", domain: "compiler" },
	])("rejects malformed identities: $kind", (input) => {
		expect(() => resolveDocumentIdentity(input as never)).toThrow();
	});
});

describe("resolveDocumentIdentityFromPath", () => {
	it.each([
		[
			"openspec/specs/taxonomy--compiler/spec.md",
			"taxonomy-domain",
		],
		[
			"openspec/specs/taxonomy--compiler--front-end/spec.md",
			"taxonomy-area",
		],
		["openspec/specs/compiler--front-end--parser/spec.md", "feature"],
		[
			"openspec/documents/platform-spec/compiler--front-end--parser/articles/grammar-notes.md",
			"article",
		],
		[
			"openspec/documents/platform-spec/compiler--front-end--parser/decisions/0001-parser-shape.md",
			"decision",
		],
	] as const)("parses %s", (canonicalPath, kind) => {
		expect(resolveDocumentIdentityFromPath(canonicalPath).kind).toBe(kind);
	});

	it("rejects paths outside the canonical grammar", () => {
		expect(() =>
			resolveDocumentIdentityFromPath(
				"openspec/specs/compiler--front-end/spec.md",
			),
		).toThrow("Unknown canonical Platform Spec document path");
	});
});

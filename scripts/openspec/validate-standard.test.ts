import assert from "node:assert/strict";
import test from "node:test";

import { validateDocumentCatalog } from "./validate-standard.ts";

const fixtureDocuments = [
	{
		path: "openspec/specs/taxonomy--compiler/spec.md",
		kind: "taxonomy-domain",
		parentCapability: null,
		authority: "provisional",
	},
	{
		path: "openspec/specs/taxonomy--compiler--front-end/spec.md",
		kind: "taxonomy-area",
		parentCapability: "taxonomy--compiler",
		authority: "provisional",
	},
	{
		path: "openspec/specs/compiler--front-end--parser/spec.md",
		kind: "feature",
		parentCapability: "taxonomy--compiler--front-end",
		authority: "normative",
	},
	{
		path: "openspec/documents/platform-spec/compiler--front-end--parser/articles/grammar-notes.md",
		kind: "article",
		parentCapability: "compiler--front-end--parser",
		authority: "informative",
	},
	{
		path: "openspec/documents/platform-spec/compiler--front-end--parser/decisions/0001-parser-shape.md",
		kind: "unknown",
		parentCapability: "compiler--front-end--parser",
		authority: "informative",
	},
];

test("rejects an unknown Platform Spec document kind", () => {
	assert.deepEqual(validateDocumentCatalog(fixtureDocuments), [
		"Unknown Platform Spec document kind: unknown (openspec/documents/platform-spec/compiler--front-end--parser/decisions/0001-parser-shape.md)",
	]);
});

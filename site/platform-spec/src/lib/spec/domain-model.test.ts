import { describe, expect, it } from "vitest";

import type {
	OpenSpecCatalog,
	OpenSpecCatalogDocument,
} from "#/lib/spec/catalog";
import {
	resolveDocumentIdentity,
	type SpecDocumentIdentityInput,
} from "#/lib/spec/document-identity";
import { buildDomainModel, buildNavTree } from "#/lib/spec/domain-model";

function document(
	input: SpecDocumentIdentityInput,
	title: string,
): OpenSpecCatalogDocument {
	const identity = resolveDocumentIdentity(input);
	return {
		...identity,
		identity,
		id: identity.key,
		slug: identity.publicSlug,
		title,
		description: null,
		status: identity.kind.startsWith("taxonomy-") ? "Proposed" : "Standard",
		pathClass: identity.artifactKind,
		sourceHash: "hash",
		specPath: identity.canonicalPath.replace(/^openspec\//, ""),
		legacySlugs: [],
		bookLinks: [],
		requirements: [],
	} as OpenSpecCatalogDocument;
}

const documents: OpenSpecCatalogDocument[] = [
	document({ kind: "domain", domain: "compiler" }, "Compiler"),
	document(
		{ kind: "area", domain: "compiler", area: "front-end" },
		"Front end",
	),
	document(
		{ kind: "area", domain: "compiler", area: "codegen" },
		"Codegen",
	),
	document({ kind: "domain", domain: "language" }, "Language"),
	document(
		{ kind: "area", domain: "language", area: "syntax" },
		"Syntax",
	),
	document(
		{
			kind: "feature",
			domain: "compiler",
			area: "front-end",
			feature: "parser",
		},
		"Parser",
	),
	document(
		{
			kind: "feature",
			domain: "compiler",
			area: "front-end",
			feature: "lexer",
		},
		"Lexer",
	),
	document(
		{
			kind: "feature",
			domain: "compiler",
			area: "codegen",
			feature: "lowering",
		},
		"Lowering",
	),
	document(
		{
			kind: "feature",
			domain: "language",
			area: "syntax",
			feature: "blocks",
		},
		"Blocks",
	),
	document(
		{
			kind: "article",
			domain: "compiler",
			area: "front-end",
			feature: "parser",
			article: "grammar-notes",
		},
		"Grammar notes",
	),
];

const catalog: OpenSpecCatalog = {
	version: 1,
	revision: "rev1",
	generatedAt: new Date(0).toISOString(),
	documents,
	entries: documents,
};

describe("domain-area-feature model", () => {
	it("uses taxonomy documents as domain and area routes", () => {
		const model = buildDomainModel(catalog);
		const compiler = model.domains.find((domain) => domain.domain === "compiler");
		const frontEnd = compiler?.areas.find((area) => area.area === "front-end");

		expect(compiler?.href).toBe("/platform-spec/domains/compiler/");
		expect(frontEnd?.href).toBe(
			"/platform-spec/domains/compiler/areas/front-end/",
		);
	});

	it("counts and groups only feature documents as features", () => {
		const model = buildDomainModel(catalog);
		expect(model.domainCount).toBe(2);
		expect(model.areaCount).toBe(3);
		expect(model.featureCount).toBe(4);
		const compiler = model.domains.find((domain) => domain.domain === "compiler");
		expect(compiler?.areas.map((area) => area.area).sort()).toEqual([
			"codegen",
			"front-end",
		]);
		expect(
			compiler?.areas.find((area) => area.area === "front-end")?.features,
		).toHaveLength(2);
	});

	it("builds taxonomy navigation with feature-owned documents", () => {
		const nav = buildNavTree(catalog);
		const compiler = nav.children?.find(
			(document) => document.title === "Compiler",
		);
		const frontEnd = compiler?.children?.find(
			(document) => document.title === "Front end",
		);
		const parser = frontEnd?.children?.find(
			(document) => document.title === "Parser",
		);

		expect(compiler?.level).toBe("domain");
		expect(frontEnd?.level).toBe("area");
		expect(parser?.level).toBe("feature");
		expect(parser?.children).toEqual([
			expect.objectContaining({ level: "article", title: "Grammar notes" }),
		]);
	});
});

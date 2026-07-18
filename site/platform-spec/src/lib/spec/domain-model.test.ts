import { describe, expect, it } from "vitest";

import type { OpenSpecCatalog, OpenSpecCatalogEntry } from "#/lib/spec/catalog";
import { buildDomainModel, buildNavTree } from "#/lib/spec/domain-model";

function entry(
	capability: string,
	overrides: Partial<OpenSpecCatalogEntry> = {},
): OpenSpecCatalogEntry {
	const [domain, area, feature] = capability.split("--");
	return {
		id: capability,
		capability,
		slug: `platform-spec/capabilities/${capability}`,
		href: `/platform-spec/capabilities/${capability}/`,
		title: feature ?? capability,
		description: null,
		status: "Standard",
		pathClass: "feature",
		specLevel: "feature",
		parentSlug: "platform-spec",
		domain: domain ?? null,
		area: area ?? null,
		feature: feature ?? null,
		specPath: `specs/${capability}/spec.md`,
		legacySlugs: [],
		bookLinks: [],
		requirements: [],
		...overrides,
	};
}

const catalog: OpenSpecCatalog = {
	version: 1,
	revision: "rev1",
	generatedAt: new Date(0).toISOString(),
	entries: [
		entry("compiler--front-end--parser"),
		entry("compiler--front-end--lexer"),
		entry("compiler--codegen--lowering"),
		entry("language--syntax--blocks"),
	],
};

describe("domain-area-feature model", () => {
	it("groups capabilities into domains, areas, and features", () => {
		const model = buildDomainModel(catalog);
		expect(model.domainCount).toBe(2);
		expect(model.areaCount).toBe(3);
		expect(model.featureCount).toBe(4);
		const compiler = model.domains.find((d) => d.domain === "compiler");
		expect(compiler?.areas.map((a) => a.area).sort()).toEqual([
			"codegen",
			"front-end",
		]);
		const frontEnd = compiler?.areas.find((a) => a.area === "front-end");
		expect(frontEnd?.features).toHaveLength(2);
	});

	it("builds a root -> domain -> area -> feature nav tree", () => {
		const nav = buildNavTree(catalog);
		expect(nav.level).toBe("root");
		expect(nav.children).toHaveLength(2);
		const domain = nav.children?.[0];
		expect(domain?.level).toBe("domain");
		expect(domain?.children?.[0]?.level).toBe("area");
		expect(domain?.children?.[0]?.children?.[0]?.level).toBe("feature");
	});
});

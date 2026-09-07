import { describe, expect, it } from "vitest";

import { parseOpenSpecCatalogNav } from "#/lib/platform-spec/open-spec-catalog";

describe("parseOpenSpecCatalogNav", () => {
	it("adapts the current platform catalog", () => {
		const result = parseOpenSpecCatalogNav({
			generatedAt: "2026-07-13T00:00:00.000Z",
			entries: [
				{
					slug: "platform-spec/tooling/nexus",
					href: "/platform-spec/tooling/nexus/",
					title: "Beskid Nexus",
					specLevel: "feature",
				},
			],
		});

		expect(result.revision).toBe("2026-07-13T00:00:00.000Z");
		expect(result.entries[0]).toMatchObject({
			slug: "platform-spec/tooling/nexus",
			href: "/platform-spec/tooling/nexus/",
			title: "Beskid Nexus",
			level: "feature",
			domain: "tooling",
			area: "nexus",
		});
	});

	it("adapts stable OpenSpec identifiers and legacy aliases", () => {
		const result = parseOpenSpecCatalogNav({
			revision: "sha256:catalog-1",
			entries: [
				{
					stableId: "standard.tooling.nexus.mcp",
					title: "MCP transport",
					kind: "requirement",
					canonicalUrl: "/standard/tooling--nexus#mcp-transport",
					legacySlugs: ["platform-spec/tooling/nexus/contracts-and-edge-cases"],
					domain: "tooling",
					area: "nexus",
					requirements: [
						{
							id: "BSP-REQ-MCP",
							title: "Authenticated transport",
							anchor: "requirement-authenticated-transport",
						},
					],
				},
			],
		});

		expect(result.revision).toBe("sha256:catalog-1");
		expect(result.entries[0]).toMatchObject({
			standardId: "standard.tooling.nexus.mcp",
			catalogRevision: "sha256:catalog-1",
			slug: "platform-spec/tooling/nexus/contracts-and-edge-cases",
			href: "/standard/tooling--nexus#mcp-transport",
			level: "requirement",
		});
		expect(result.entries[1]).toMatchObject({
			standardId: "BSP-REQ-MCP",
			catalogRevision: "sha256:catalog-1",
			href: "/standard/tooling--nexus#requirement-authenticated-transport",
			level: "requirement",
			domain: "tooling",
			area: "nexus",
		});
	});

	it("uses a normalized requirement id as its anchor", () => {
		const result = parseOpenSpecCatalogNav({
			revision: "catalog-2",
			entries: [
				{
					id: "BSP-CAP-NEXUS",
					title: "Nexus",
					path: "/platform-spec/tooling/nexus/",
					requirements: [
						{ id: "authenticated-transport", title: "Authenticated transport" },
					],
				},
			],
		});

		expect(result.entries[1]).toMatchObject({
			standardId: "authenticated-transport",
			href: "/platform-spec/tooling/nexus/#authenticated-transport",
			level: "requirement",
		});
	});
});

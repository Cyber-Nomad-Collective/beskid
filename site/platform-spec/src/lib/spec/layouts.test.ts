import { describe, expect, it } from "vitest";

import {
	loadLayoutRegistry,
	resolveLayout,
	type SpecLayout,
	validateLayout,
} from "#/lib/spec/layouts";
import { resolveOpenSpecRoot } from "#/lib/spec/catalog";

const featureLayout: SpecLayout = {
	id: "feature",
	specLevel: "feature",
	title: "Feature capability layout",
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
};

const conforming = `# Blocks

## Purpose

Defines blocks.

## Requirements

### Requirement: Block delimiter
Blocks use braces.
`;

describe("layout validation", () => {
	it("passes a conforming feature spec", () => {
		expect(validateLayout(conforming, featureLayout)).toEqual([]);
	});

	it("flags a missing required section", () => {
		const body = "# Blocks\n\n## Purpose\n\nText only.\n";
		const violations = validateLayout(body, featureLayout);
		expect(violations.map((violation) => violation.code)).toContain(
			"missing-section",
		);
		expect(violations.some((v) => v.heading === "Requirements")).toBe(true);
	});

	it("flags a section that lacks required content", () => {
		const body =
			"# Blocks\n\n## Purpose\n\nText.\n\n## Requirements\n\nNo requirement headings here.\n";
		const violations = validateLayout(body, featureLayout);
		expect(violations.map((violation) => violation.code)).toContain(
			"section-content",
		);
	});

	it("flags a missing title", () => {
		const body = "## Purpose\n\nText.\n\n## Requirements\n\n### Requirement: X\nBody.\n";
		const violations = validateLayout(body, featureLayout);
		expect(violations.map((violation) => violation.code)).toContain(
			"missing-title",
		);
	});

	it("resolves the feature layout from the native OpenSpec registry", () => {
		const registry = loadLayoutRegistry(resolveOpenSpecRoot());
		expect(registry).not.toBeNull();
		if (!registry) return;
		const layout = resolveLayout("feature", registry);
		expect(layout?.id).toBe("feature");
		const fallback = resolveLayout("unknown-level", registry);
		expect(fallback?.id).toBe(registry.index.default);
	});
});

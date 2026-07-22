import { describe, expect, it } from "vitest";

import {
	deriveArchitectureNeighborhood,
	layoutArchitectureMap,
} from "#/components/reader/architecture-map-layout";
import {
	resolveArchitectureModel,
	type ArchitectureManifest,
} from "#/lib/architecture/architecture-model";

const manifest: ArchitectureManifest = {
	groups: [{ id: "compiler", label: "Compiler", description: "Compiler graph" }],
	nodes: [
		{ id: "source", label: "Source", description: "Input", group: "compiler", kind: "source", state: "current", specKeys: [], sourcePaths: ["compiler"] },
		{ id: "typed", label: "Typed program", description: "Typed IR", group: "compiler", kind: "representation", state: "current", specKeys: [], sourcePaths: ["compiler"] },
		{ id: "artifact", label: "Artifact", description: "Output", group: "compiler", kind: "artifact", state: "current", specKeys: [], sourcePaths: ["compiler"] },
	],
	edges: [
		{ id: "source-to-typed", from: "source", to: "typed", kind: "transforms", label: "Parses", description: "Produces typed IR", state: "current" },
		{ id: "typed-to-artifact", from: "typed", to: "artifact", kind: "transforms", label: "Lowers", description: "Produces artifact", state: "current" },
	],
	traversals: { build: ["source", "typed", "artifact"], ide: ["source"], "spec-to-code": ["source", "typed"] },
};

const model = resolveArchitectureModel(manifest, []);

describe("architecture map layout", () => {
	it("lays out every node deterministically from left to right with stable dimensions", () => {
		const first = layoutArchitectureMap(model);
		const second = layoutArchitectureMap(model);

		expect(first.nodes).toEqual(second.nodes);
		expect(first.nodes.every((node) => node.width === 232 && node.height === 104)).toBe(true);
		expect(first.nodes.find((node) => node.id === "source")!.position.x).toBeLessThan(
			first.nodes.find((node) => node.id === "typed")!.position.x,
		);
		expect(first.nodes.find((node) => node.id === "typed")!.position.x).toBeLessThan(
			first.nodes.find((node) => node.id === "artifact")!.position.x,
		);
	});

	it("keeps all rendered edge endpoints in the resolved model", () => {
		const layout = layoutArchitectureMap(model);
		const nodeIds = new Set(layout.nodes.map((node) => node.id));

		for (const edge of layout.edges) {
			expect(nodeIds.has(edge.source)).toBe(true);
			expect(nodeIds.has(edge.target)).toBe(true);
		}
	});

	it("derives the selected node and its direct neighborhood", () => {
		expect(deriveArchitectureNeighborhood(model, "typed")).toEqual(
			new Set(["source", "typed", "artifact"]),
		);
		expect(deriveArchitectureNeighborhood(model, null)).toEqual(new Set());
	});
});

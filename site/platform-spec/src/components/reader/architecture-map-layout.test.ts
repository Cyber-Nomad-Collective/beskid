import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import {
	deriveArchitectureNeighborhood,
	layoutArchitectureMap,
} from "#/components/reader/architecture-map-layout";
import {
	type ArchitectureManifest,
	resolveArchitectureModel,
} from "#/lib/architecture/architecture-model";

const manifest: ArchitectureManifest = {
	groups: [
		{
			id: "compiler",
			label: "Compiler",
			description: "Compiler graph",
			order: 0,
		},
	],
	nodes: [
		{
			id: "source",
			label: "Source",
			description: "Input",
			group: "compiler",
			kind: "source",
			state: "current",
			specKeys: [],
			sourcePaths: ["compiler"],
		},
		{
			id: "typed",
			label: "Typed program",
			description: "Typed IR",
			group: "compiler",
			kind: "representation",
			state: "current",
			specKeys: [],
			sourcePaths: ["compiler"],
		},
		{
			id: "artifact",
			label: "Artifact",
			description: "Output",
			group: "compiler",
			kind: "artifact",
			state: "current",
			specKeys: [],
			sourcePaths: ["compiler"],
		},
	],
	edges: [
		{
			id: "source-to-typed",
			from: "source",
			to: "typed",
			kind: "transforms",
			label: "Parses",
			description: "Produces typed IR",
			state: "current",
		},
		{
			id: "typed-to-artifact",
			from: "typed",
			to: "artifact",
			kind: "transforms",
			label: "Lowers",
			description: "Produces artifact",
			state: "current",
		},
	],
	traversals: {
		build: ["source", "typed", "artifact"],
		ide: ["source"],
		"spec-to-code": ["source", "typed"],
	},
};

const model = resolveArchitectureModel(manifest, []);

describe("architecture map layout", () => {
	it("lays out every node deterministically from left to right with stable dimensions", () => {
		const first = layoutArchitectureMap(model);
		const second = layoutArchitectureMap(model);

		expect(first.nodes).toEqual(second.nodes);
		const memberNodes = first.nodes.filter((n) => n.type === "architecture");
		expect(
			memberNodes.every((node) => node.width === 232 && node.height === 104),
		).toBe(true);
		expect(
			first.nodes.find((node) => node.id === "source")?.position.y,
		).toBeLessThan(first.nodes.find((node) => node.id === "typed")?.position.y);
		expect(
			first.nodes.find((node) => node.id === "typed")?.position.y,
		).toBeLessThan(
			first.nodes.find((node) => node.id === "artifact")?.position.y,
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

	it("provides static left and right edge anchors for every architecture card", () => {
		const layout = layoutArchitectureMap(model);

		for (const node of layout.nodes.filter((n) => n.type === "architecture")) {
			expect(node.targetPosition).toBe(Position.Top);
			expect(node.sourcePosition).toBe(Position.Bottom);
		}
	});

	it("renders selected neighborhoods and active traversal edges with visible emphasis", () => {
		const inactive = layoutArchitectureMap(model);
		const selected = layoutArchitectureMap(model, { selectedNodeId: "typed" });
		const traversal = layoutArchitectureMap(model, {
			traversalNodeIds: ["source", "typed"],
		});

		for (const edge of inactive.edges) {
			expect(edge.selected).toBe(false);
			expect(edge.animated).toBe(false);
			expect(edge.style).toMatchObject({ opacity: 0.35 });
		}
		for (const edge of selected.edges) {
			expect(edge.selected).toBe(true);
			expect(edge.animated).toBe(true);
			expect(edge.style).toMatchObject({ opacity: 1, strokeWidth: 2.5 });
		}
		expect(
			traversal.edges.find((edge) => edge.id === "source-to-typed"),
		).toMatchObject({
			selected: true,
			animated: true,
			style: { opacity: 1, strokeWidth: 2.5 },
		});
		expect(
			traversal.edges.find((edge) => edge.id === "typed-to-artifact"),
		).toMatchObject({
			selected: false,
			animated: false,
			style: { opacity: 0.35 },
		});
	});

	it("derives the selected node and its direct neighborhood", () => {
		expect(deriveArchitectureNeighborhood(model, "typed")).toEqual(
			new Set(["source", "typed", "artifact"]),
		);
		expect(deriveArchitectureNeighborhood(model, null)).toEqual(new Set());
	});
});

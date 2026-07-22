import { describe, expect, it } from "vitest";

import {
	BuildTraversal,
	CompilerArchitectureManifest,
} from "#/lib/architecture/compiler-architecture";
import {
	resolveArchitectureModel,
	type ArchitectureManifest,
} from "#/lib/architecture/architecture-model";

const catalogEntries = [
	{
		capability: "compiler--build-pipeline--stage-ordering",
		href: "/platform-spec/capabilities/compiler--build-pipeline--stage-ordering/",
		title: "Stage ordering",
	},
] as const;

function catalogForManifest() {
	return [...new Set(CompilerArchitectureManifest.nodes.flatMap((node) => node.specKeys))].map(
		(capability) => ({
			capability,
			href: `/platform-spec/capabilities/${capability}/`,
			title: capability,
		}),
	);
}

function manifest(overrides: Partial<ArchitectureManifest> = {}): ArchitectureManifest {
	return {
		groups: [{ id: "test", label: "Test", description: "Test group" }],
		nodes: [
			{
				id: "source",
				label: "Source",
				description: "Source input",
				group: "test",
				kind: "source",
				state: "current",
				specKeys: ["compiler--build-pipeline--stage-ordering"],
				sourcePaths: ["compiler/source"],
			},
			{
				id: "output",
				label: "Output",
				description: "Compiled output",
				group: "test",
				kind: "artifact",
				state: "target",
				specKeys: ["compiler--future--output"],
				sourcePaths: [],
			},
		],
		edges: [
			{
				id: "source-to-output",
				from: "source",
				to: "output",
				kind: "transforms",
				label: "Compiles",
				description: "Compiles source to output",
				state: "current",
			},
		],
		traversals: { build: ["source", "output"], ide: ["source"], "spec-to-code": ["source"] },
		...overrides,
	};
}

describe("architecture model", () => {
	it("rejects duplicate node IDs", () => {
		const base = manifest();
		const duplicate = manifest({
			nodes: [...base.nodes, { ...base.nodes[0]!, label: "Duplicate" }],
		});
		expect(() => resolveArchitectureModel(duplicate, catalogEntries)).toThrow(
			'duplicate node ID "source"',
		);
	});

	it("rejects edges with unknown endpoints", () => {
		const invalid = manifest({
			edges: [{ ...manifest().edges[0]!, to: "missing" }],
		});
		expect(() => resolveArchitectureModel(invalid, catalogEntries)).toThrow(
			'unknown node "missing"',
		);
	});

	it("fails closed when a current spec key is unresolved", () => {
		const invalid = manifest();
		invalid.nodes[0]!.specKeys = ["compiler--missing--capability"];
		expect(() => resolveArchitectureModel(invalid, catalogEntries)).toThrow(
			'unresolved current spec key "compiler--missing--capability"',
		);
	});

	it("keeps target-only unresolved keys as unavailable evidence", () => {
		const model = resolveArchitectureModel(manifest(), catalogEntries);
		expect(model.nodesById.output.specLinks).toEqual([
			{ capability: "compiler--future--output", available: false },
		]);
	});

	it("resolves only exact catalog capability URLs", () => {
		const model = resolveArchitectureModel(manifest(), catalogEntries);
		expect(model.nodesById.source.specLinks).toEqual([
			{
				capability: "compiler--build-pipeline--stage-ordering",
				href: "/platform-spec/capabilities/compiler--build-pipeline--stage-ordering/",
				title: "Stage ordering",
				available: true,
			},
		]);
	});

	it("builds typed adjacency for direct graph traversal", () => {
		const model = resolveArchitectureModel(manifest(), catalogEntries);
		expect(model.adjacency.source).toEqual(["output"]);
		expect(model.adjacency.output).toEqual(["source"]);
		expect(model.edges[0]).toMatchObject({ kind: "transforms", from: "source", to: "output" });
	});

	it("rejects manifests with an unknown traversal ID", () => {
		const base = manifest();
		const invalid = {
			...base,
			traversals: { ...base.traversals, preview: ["source"] },
		} as unknown as ArchitectureManifest;
		expect(() => resolveArchitectureModel(invalid, catalogEntries)).toThrow(
			'unknown traversal ID "preview"',
		);
	});

	it("requires build, ide, and spec-to-code traversals", () => {
		const base = manifest();
		const invalid = {
			...base,
			traversals: { build: base.traversals.build, ide: base.traversals.ide },
		} as unknown as ArchitectureManifest;
		expect(() => resolveArchitectureModel(invalid, catalogEntries)).toThrow(
			'missing required traversal "spec-to-code"',
		);
	});

	it("provides the complete canonical AOT build traversal", () => {
		const model = resolveArchitectureModel(CompilerArchitectureManifest, catalogForManifest());
		expect(model.traversals.build).toEqual(BuildTraversal);
		expect(model.traversals.build).toHaveLength(13);
	});

	it("keeps typed-HIR and Rust runtime compatibility nodes visibly transitional", () => {
		const model = resolveArchitectureModel(CompilerArchitectureManifest, catalogForManifest());
		expect(model.nodesById["typed-hir-compatibility"].state).toBe("transitional");
		expect(model.nodesById["rust-runtime-host-compatibility"].state).toBe("retiring");
	});

	it("connects every consecutive step in each named traversal", () => {
		const model = resolveArchitectureModel(CompilerArchitectureManifest, catalogForManifest());
		for (const traversal of Object.values(model.traversals)) {
			for (let index = 0; index < traversal.length - 1; index += 1) {
				expect(model.adjacency[traversal[index]!]).toContain(traversal[index + 1]);
			}
		}
	});

	it("connects direct compiler boundary and compatibility nodes", () => {
		const model = resolveArchitectureModel(CompilerArchitectureManifest, catalogForManifest());
		const boundaryIds = [
			"bsol-manifest",
			"pckg",
			"corelib",
			"compiler-mods",
			"parser",
			"typed-hir-compatibility",
			"abi-manifest",
			"generated-abi",
			"rust-runtime-host-compatibility",
			"cli",
		] as const;
		for (const nodeId of boundaryIds) expect(model.adjacency[nodeId]).not.toHaveLength(0);
	});
});

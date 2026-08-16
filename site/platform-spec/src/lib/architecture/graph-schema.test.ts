import { describe, expect, it } from "vitest";

import {
	coerceAuthorGraph,
	parseInlineEdges,
	parseInlineGraph,
	parseInlineNodes,
} from "#/lib/architecture/graph-schema";

describe("author graph inline parsing", () => {
	it("parses bare node ids with default kind", () => {
		expect(parseInlineNodes("scheduler, fiber, gc")).toEqual([
			{ id: "scheduler", label: "scheduler", kind: "process" },
			{ id: "fiber", label: "fiber", kind: "process" },
			{ id: "gc", label: "gc", kind: "process" },
		]);
	});

	it("parses id:label:kind triples", () => {
		expect(
			parseInlineNodes("fiber:Channel:representation, gc:GC:process"),
		).toEqual([
			{ id: "fiber", label: "Channel", kind: "representation" },
			{ id: "gc", label: "GC", kind: "process" },
		]);
	});

	it("parses id:label pairs with default kind", () => {
		expect(parseInlineNodes("scheduler:Scheduler")).toEqual([
			{ id: "scheduler", label: "Scheduler", kind: "process" },
		]);
	});

	it("parses edges with kind only", () => {
		expect(
			parseInlineEdges("scheduler->fiber:spawns, fiber->channel:reads"),
		).toEqual([
			{
				id: "scheduler-to-fiber",
				from: "scheduler",
				to: "fiber",
				kind: "spawns",
				label: undefined,
			},
			{
				id: "fiber-to-channel",
				from: "fiber",
				to: "channel",
				kind: "reads",
				label: undefined,
			},
		]);
	});

	it("parses edges with kind and label", () => {
		expect(parseInlineEdges("scheduler->fiber:spawns:Spawn fiber")).toEqual([
			{
				id: "scheduler-to-fiber",
				from: "scheduler",
				to: "fiber",
				kind: "spawns",
				label: "Spawn fiber",
			},
		]);
	});

	it("defaults edge kind to transforms when omitted", () => {
		expect(parseInlineEdges("scheduler->fiber")).toEqual([
			{
				id: "scheduler-to-fiber",
				from: "scheduler",
				to: "fiber",
				kind: "transforms",
				label: undefined,
			},
		]);
	});

	it("disambiguates duplicate edge ids with a suffix", () => {
		const edges = parseInlineEdges("a->b, a->b");
		expect(edges[0].id).toBe("a-to-b");
		expect(edges[1].id).toBe("a-to-b-1");
	});

	it("builds a graph from directive fields", () => {
		const graph = parseInlineGraph({
			title: "Fiber scheduler data flow",
			nodes: "scheduler, fiber, channel, gc",
			edges: "scheduler->fiber:spawns, fiber->channel:reads, fiber->gc:roots",
		});
		expect(graph).not.toBeNull();
		expect(graph?.title).toBe("Fiber scheduler data flow");
		expect(graph?.id).toBe("fiber-scheduler-data-flow");
		expect(graph?.nodes).toHaveLength(4);
		expect(graph?.edges).toHaveLength(3);
		expect(graph?.layout).toBe("auto");
	});

	it("returns null for ref-based graphs without nodes or edges", () => {
		expect(parseInlineGraph({ ref: "compiler", title: "Compiler" })).toBeNull();
	});
});

describe("coerceAuthorGraph", () => {
	it("coerces a bare author graph object", () => {
		const graph = coerceAuthorGraph({
			id: "test",
			title: "Test",
			nodes: [{ id: "a", label: "A", kind: "process" }],
			edges: [{ id: "e1", from: "a", to: "a", kind: "transforms" }],
		});
		expect(graph).not.toBeNull();
		expect(graph?.id).toBe("test");
		expect(graph?.nodes).toHaveLength(1);
		expect(graph?.edges).toHaveLength(1);
	});

	it("coerces a full ArchitectureManifest shape", () => {
		const graph = coerceAuthorGraph({
			title: "Compiler",
			groups: [{ id: "g1", label: "Group 1", description: "d", order: 0 }],
			nodes: [
				{
					id: "src",
					label: "Source",
					group: "g1",
					kind: "source",
					state: "current",
					specKeys: ["compiler--cap"],
					sourcePaths: ["compiler/src"],
				},
			],
			edges: [
				{
					id: "e1",
					from: "src",
					to: "src",
					kind: "transforms",
					label: "T",
					state: "current",
				},
			],
			traversals: { build: ["src"], ide: ["src"], "spec-to-code": ["src"] },
		});
		expect(graph).not.toBeNull();
		expect(graph?.nodes[0]?.specKey).toBe("compiler--cap");
		expect(graph?.nodes[0]?.sourcePath).toBe("compiler/src");
		expect(graph?.nodes[0]?.group).toBe("g1");
		expect(graph?.groups).toEqual([{ id: "g1", label: "Group 1" }]);
	});

	it("returns null for non-graph payloads", () => {
		expect(coerceAuthorGraph(null)).toBeNull();
		expect(coerceAuthorGraph({})).toBeNull();
		expect(coerceAuthorGraph({ nodes: "not-array" })).toBeNull();
	});
});

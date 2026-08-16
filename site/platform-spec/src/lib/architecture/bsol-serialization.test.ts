import { describe, expect, it } from "vitest";

import {
	BSOL_GRAPH_SCHEMA,
	deserializeGraphFromBsol,
	serializeGraphToBsol,
	validateGraph,
} from "#/lib/architecture/bsol-serialization";
import type { AuthorArchitectureGraph } from "#/lib/architecture/graph-schema";

function sampleGraph(
	overrides: Partial<AuthorArchitectureGraph> = {},
): AuthorArchitectureGraph {
	return {
		id: "fiber-flow",
		title: "Fiber scheduler data flow",
		description: "How fibers are scheduled and collected.",
		groups: [{ id: "runtime", label: "Runtime" }],
		nodes: [
			{ id: "scheduler", label: "Scheduler", kind: "process", group: "runtime" },
			{ id: "fiber", label: "Fiber", kind: "process", group: "runtime" },
			{ id: "gc", label: "GC", kind: "process", group: "runtime" },
		],
		edges: [
			{ id: "scheduler-to-fiber", from: "scheduler", to: "fiber", kind: "spawns" },
			{ id: "fiber-to-gc", from: "fiber", to: "gc", kind: "roots" },
		],
		layout: "auto",
		...overrides,
	};
}

describe("BSOL graph serialization", () => {
	it("serializes with the schema marker and sorted keys", () => {
		const json = serializeGraphToBsol(sampleGraph());
		expect(json).toContain(`"$schema": "${BSOL_GRAPH_SCHEMA}"`);
		// "graph" key comes before "$schema" alphabetically? No: $ sorts before letters.
		// $schema < graph in ASCII, so $schema appears first.
		const schemaIdx = json.indexOf("$schema");
		const graphIdx = json.indexOf('"graph"');
		expect(schemaIdx).toBeLessThan(graphIdx);
		expect(json).toContain('"fiber-flow"');
	});

	it("produces deterministic output for the same graph", () => {
		const a = serializeGraphToBsol(sampleGraph());
		const b = serializeGraphToBsol(sampleGraph());
		expect(a).toBe(b);
	});

	it("sorts nested object keys", () => {
		const json = serializeGraphToBsol(sampleGraph());
		// Node keys are sorted alphabetically: group, id, kind, label.
		// "scheduler" node: group comes before id comes before kind comes before label.
		const groupIdx = json.indexOf('"group": "runtime"');
		const idIdx = json.indexOf('"id": "scheduler"');
		const kindIdx = json.indexOf('"kind": "process"');
		const labelIdx = json.indexOf('"label": "Scheduler"');
		expect(groupIdx).toBeLessThan(idIdx);
		expect(idIdx).toBeLessThan(kindIdx);
		expect(kindIdx).toBeLessThan(labelIdx);
	});

	it("round-trips through serialize and deserialize", () => {
		const original = sampleGraph();
		const json = serializeGraphToBsol(original);
		const restored = deserializeGraphFromBsol(json);
		expect(restored.id).toBe(original.id);
		expect(restored.title).toBe(original.title);
		expect(restored.nodes).toEqual(original.nodes);
		expect(restored.edges).toEqual(original.edges);
		expect(restored.groups).toEqual(original.groups);
	});

	it("deserializes a bare graph without the wrapper", () => {
		const bare = JSON.stringify(sampleGraph(), null, 2);
		const restored = deserializeGraphFromBsol(bare);
		expect(restored.id).toBe("fiber-flow");
		expect(restored.nodes).toHaveLength(3);
	});

	it("throws on invalid JSON", () => {
		expect(() => deserializeGraphFromBsol("{not json")).toThrow();
	});

	it("throws on a payload without nodes/edges", () => {
		expect(() =>
			deserializeGraphFromBsol(JSON.stringify({ foo: "bar" })),
		).toThrow("invalid BSOL graph: missing nodes or edges");
	});
});

describe("validateGraph", () => {
	it("returns no errors for a valid graph", () => {
		expect(validateGraph(sampleGraph())).toEqual([]);
	});

	it("reports duplicate node ids", () => {
		const errors = validateGraph(
			sampleGraph({
				nodes: [
					{ id: "scheduler", label: "S", kind: "process" },
					{ id: "scheduler", label: "Dup", kind: "process" },
				],
			}),
		);
		expect(errors).toContain('duplicate node id "scheduler"');
	});

	it("reports dangling edge endpoints", () => {
		const errors = validateGraph(
			sampleGraph({
				nodes: [{ id: "scheduler", label: "S", kind: "process" }],
				edges: [{ id: "e1", from: "scheduler", to: "missing", kind: "spawns" }],
			}),
		);
		expect(errors).toContain('edge "e1" references unknown node "missing"');
	});

	it("reports duplicate edge ids", () => {
		const errors = validateGraph(
			sampleGraph({
				nodes: [
					{ id: "a", label: "A", kind: "process" },
					{ id: "b", label: "B", kind: "process" },
				],
				edges: [
					{ id: "dup", from: "a", to: "b", kind: "t" },
					{ id: "dup", from: "b", to: "a", kind: "t" },
				],
			}),
		);
		expect(errors).toContain('duplicate edge id "dup"');
	});

	it("reports duplicate group ids", () => {
		const errors = validateGraph(
			sampleGraph({
				groups: [
					{ id: "g", label: "G" },
					{ id: "g", label: "Dup" },
				],
			}),
		);
		expect(errors).toContain('duplicate group id "g"');
	});

	it("reports missing id and title", () => {
		const errors = validateGraph({ ...sampleGraph(), id: "", title: "" });
		expect(errors).toContain("graph id is required");
		expect(errors).toContain("graph title is required");
	});
});

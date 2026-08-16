/**
 * BSOL serialization for author architecture graphs.
 *
 * BSOL (Beskid solution/object format) serialization for architecture graphs
 * produces a deterministic JSON document with sorted keys and a
 * `"$schema": "beskid-architecture-graph/v1"` marker. The serialized form is
 * stable so that re-serializing the same graph always yields the same string.
 */

import type { AuthorArchitectureGraph } from "#/lib/architecture/graph-schema";
import { coerceAuthorGraph } from "#/lib/architecture/graph-schema";

export const BSOL_GRAPH_SCHEMA = "beskid-architecture-graph/v1";

export interface BsolGraphDocument {
	$schema: string;
	graph: AuthorArchitectureGraph;
}

/**
 * Serialize an author graph to a deterministic BSOL JSON string.
 *
 * Keys are sorted recursively and the output uses 2-space indentation so the
 * result is diff-friendly and stable across runs.
 */
export function serializeGraphToBsol(graph: AuthorArchitectureGraph): string {
	const doc: BsolGraphDocument = {
		$schema: BSOL_GRAPH_SCHEMA,
		graph,
	};
	return stableStringify(doc, 2);
}

/**
 * Parse a BSOL JSON string into an {@link AuthorArchitectureGraph}.
 *
 * Accepts both the wrapped document form (`{ "$schema": ..., "graph": ... }`)
 * and a bare graph object. Throws on invalid JSON or an unrecognizable shape.
 */
export function deserializeGraphFromBsol(
	json: string,
): AuthorArchitectureGraph {
	const raw = JSON.parse(json) as unknown;
	if (
		typeof raw === "object" &&
		raw !== null &&
		"graph" in raw &&
		typeof (raw as Record<string, unknown>).graph === "object"
	) {
		const graph = coerceAuthorGraph((raw as Record<string, unknown>).graph);
		if (!graph) throw new Error("invalid BSOL graph document: missing graph");
		return graph;
	}
	const graph = coerceAuthorGraph(raw);
	if (!graph) throw new Error("invalid BSOL graph: missing nodes or edges");
	return graph;
}

/**
 * Validate an author graph and return a list of human-readable error strings.
 *
 * An empty array means the graph is valid. Checks include duplicate node IDs,
 * duplicate edge IDs, dangling edge endpoints, and duplicate group IDs.
 */
export function validateGraph(graph: AuthorArchitectureGraph): string[] {
	const errors: string[] = [];

	if (!graph.id) errors.push("graph id is required");
	if (!graph.title) errors.push("graph title is required");

	const nodeIds = new Set<string>();
	for (const node of graph.nodes) {
		if (!node.id) {
			errors.push("node with empty id");
			continue;
		}
		if (nodeIds.has(node.id)) {
			errors.push(`duplicate node id "${node.id}"`);
		}
		nodeIds.add(node.id);
	}

	const groupIds = new Set<string>();
	for (const group of graph.groups) {
		if (!group.id) {
			errors.push("group with empty id");
			continue;
		}
		if (groupIds.has(group.id)) {
			errors.push(`duplicate group id "${group.id}"`);
		}
		groupIds.add(group.id);
	}

	const edgeIds = new Set<string>();
	for (const edge of graph.edges) {
		if (!edge.id) {
			errors.push("edge with empty id");
			continue;
		}
		if (edgeIds.has(edge.id)) {
			errors.push(`duplicate edge id "${edge.id}"`);
		}
		edgeIds.add(edge.id);
		if (!nodeIds.has(edge.from)) {
			errors.push(`edge "${edge.id}" references unknown node "${edge.from}"`);
		}
		if (!nodeIds.has(edge.to)) {
			errors.push(`edge "${edge.id}" references unknown node "${edge.to}"`);
		}
	}

	return errors;
}

/**
 * Deterministic JSON stringifier with recursively sorted object keys.
 *
 * Throws on circular references. Arrays preserve element order (only object
 * keys are sorted) so that node/edge arrays keep their authoring order while
 * individual object fields are normalized.
 */
function stableStringify(value: unknown, space: number): string {
	const seen = new WeakSet<object>();
	return JSON.stringify(sort(value), null, space);

	function sort(val: unknown): unknown {
		if (val === null || typeof val !== "object") return val;
		if (Array.isArray(val)) return val.map(sort);
		if (seen.has(val as object)) {
			throw new Error("circular reference in graph serialization");
		}
		seen.add(val as object);
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(val as Record<string, unknown>).sort()) {
			sorted[key] = sort((val as Record<string, unknown>)[key]);
		}
		return sorted;
	}
}

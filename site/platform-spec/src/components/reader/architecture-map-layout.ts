import * as dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";

import type {
	ArchitectureEdge,
	ResolvedArchitectureModel,
	ResolvedArchitectureNode,
} from "#/lib/architecture/architecture-model";

export const ArchitectureMapNodeWidth = 232;
export const ArchitectureMapNodeHeight = 104;

export interface ArchitectureMapNodeData extends Record<string, unknown> {
	node: ResolvedArchitectureNode;
	selected: boolean;
	neighbor: boolean;
	traversal: boolean;
}

export interface ArchitectureMapEdgeData extends Record<string, unknown> {
	edge: ArchitectureEdge;
	selected: boolean;
	traversal: boolean;
}

export function deriveArchitectureNeighborhood(
	model: ResolvedArchitectureModel,
	selectedNodeId: string | null,
): ReadonlySet<string> {
	if (!selectedNodeId || !model.nodesById[selectedNodeId]) return new Set();
	return new Set([selectedNodeId, ...(model.adjacency[selectedNodeId] ?? [])]);
}

export function layoutArchitectureMap(
	model: ResolvedArchitectureModel,
	options: {
		selectedNodeId?: string | null;
		traversalNodeIds?: readonly string[];
	} = {},
): { nodes: Node<ArchitectureMapNodeData>[]; edges: Edge<ArchitectureMapEdgeData>[] } {
	const graph = new dagre.Graph();
	graph.setGraph({
		rankdir: "LR",
		nodesep: 40,
		ranksep: 96,
		marginx: 32,
		marginy: 32,
	});
	graph.setDefaultEdgeLabel(() => ({}));

	for (const node of model.nodes) {
		graph.setNode(node.id, {
			width: ArchitectureMapNodeWidth,
			height: ArchitectureMapNodeHeight,
		});
	}
	for (const edge of model.edges) {
		graph.setEdge(edge.from, edge.to, { id: edge.id });
	}
	dagre.layout(graph);

	const neighborhood = deriveArchitectureNeighborhood(model, options.selectedNodeId ?? null);
	const traversal = new Set(options.traversalNodeIds ?? []);
	return {
		nodes: model.nodes.map((node) => {
			const position = graph.node(node.id) as { x?: number; y?: number } | undefined;
			return {
				id: node.id,
				type: "architecture",
				position: {
					x: (position?.x ?? 0) - ArchitectureMapNodeWidth / 2,
					y: (position?.y ?? 0) - ArchitectureMapNodeHeight / 2,
				},
				width: ArchitectureMapNodeWidth,
				height: ArchitectureMapNodeHeight,
				targetPosition: Position.Left,
				sourcePosition: Position.Right,
				data: {
					node,
					selected: node.id === options.selectedNodeId,
					neighbor: neighborhood.has(node.id) && node.id !== options.selectedNodeId,
					traversal: traversal.has(node.id),
				},
			};
		}),
		edges: model.edges.map((edge) => {
			const selected = neighborhood.has(edge.from) && neighborhood.has(edge.to);
			const traversalEdge = traversal.has(edge.from) && traversal.has(edge.to);
			const emphasized = selected || traversalEdge;
			return {
				id: edge.id,
				source: edge.from,
				target: edge.to,
				type: "smoothstep",
				label: edge.label,
				selected: emphasized,
				animated: emphasized,
				style: {
					opacity: emphasized ? 1 : 0.45,
					strokeWidth: emphasized ? 2.5 : 1.25,
				},
				data: { edge, selected, traversal: traversalEdge },
			};
		}),
	};
}

import * as dagre from "@dagrejs/dagre";
import { type Edge, type Node, Position } from "@xyflow/react";

import type {
	ArchitectureEdge,
	ArchitectureGroup,
	ResolvedArchitectureModel,
	ResolvedArchitectureNode,
} from "#/lib/architecture/architecture-model";

export const ArchitectureMapNodeWidth = 232;
export const ArchitectureMapNodeHeight = 104;

/** Horizontal padding inside a group container (each side). */
const GroupPaddingX = 40;
/** Vertical padding inside a group container (top + bottom). */
const GroupPaddingY = 56;
/** Gap between group bands. */
const GroupGap = 48;
/** Extra width reservation for the group label header. */
const GroupHeaderHeight = 36;

export interface ArchitectureMapNodeData extends Record<string, unknown> {
	node: ResolvedArchitectureNode;
	selected: boolean;
	neighbor: boolean;
	traversal: boolean;
}

export interface ArchitectureMapGroupData extends Record<string, unknown> {
	group: ArchitectureGroup;
}

export interface ArchitectureMapEdgeData extends Record<string, unknown> {
	edge: ArchitectureEdge;
	selected: boolean;
	traversal: boolean;
}

/** Maps edge kind to stroke color for visual differentiation. */
export const EdgeKindColors: Record<string, string> = {
	governs: "#7c3aed",
	evidences: "#2563eb",
	declares: "#059669",
	resolves: "#0891b2",
	parses: "#d97706",
	derives: "#9333ea",
	transforms: "#dc2626",
	verifies: "#16a34a",
	packages: "#4f46e5",
	executes: "#ea580c",
	supports: "#64748b",
};

/** Maps edge kind to dash pattern for visual differentiation. */
const EdgeKindDashPatterns: Record<string, string | undefined> = {
	governs: undefined,
	evidences: "6 3",
	declares: undefined,
	resolves: "4 4",
	parses: "2 4",
	derives: "6 3",
	transforms: undefined,
	verifies: "4 2",
	packages: undefined,
	executes: undefined,
	supports: "2 4",
};

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
): {
	nodes: Node<ArchitectureMapNodeData | ArchitectureMapGroupData>[];
	edges: Edge<ArchitectureMapEdgeData>[];
} {
	const sortedGroups = [...model.groups].sort((a, b) => a.order - b.order);
	const nodesByGroup = new Map<string, ResolvedArchitectureNode[]>();
	for (const group of sortedGroups) {
		nodesByGroup.set(group.id, []);
	}
	for (const node of model.nodes) {
		const bucket = nodesByGroup.get(node.group);
		if (bucket) bucket.push(node);
	}

	// Layout each group with TB dagre, then stack groups vertically.
	let globalY = 0;
	const groupPositions: {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
	}[] = [];
	const nodePositions = new Map<string, { x: number; y: number }>();

	for (const group of sortedGroups) {
		const groupNodes = nodesByGroup.get(group.id) ?? [];
		if (groupNodes.length === 0) continue;

		const g = new dagre.Graph();
		g.setGraph({
			rankdir: "TB",
			nodesep: 40,
			ranksep: 80,
			marginx: GroupPaddingX,
			marginy: GroupPaddingY,
		});
		g.setDefaultEdgeLabel(() => ({}));

		const groupNodeIds = new Set(groupNodes.map((n) => n.id));
		for (const node of groupNodes) {
			g.setNode(node.id, {
				width: ArchitectureMapNodeWidth,
				height: ArchitectureMapNodeHeight,
			});
		}
		for (const edge of model.edges) {
			if (groupNodeIds.has(edge.from) && groupNodeIds.has(edge.to)) {
				g.setEdge(edge.from, edge.to, { id: edge.id });
			}
		}
		dagre.layout(g);

		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		for (const node of groupNodes) {
			const pos = g.node(node.id) as { x?: number; y?: number } | undefined;
			const nx = (pos?.x ?? 0) - ArchitectureMapNodeWidth / 2;
			const ny = (pos?.y ?? 0) - ArchitectureMapNodeHeight / 2;
			if (nx < minX) minX = nx;
			if (nx + ArchitectureMapNodeWidth > maxX)
				maxX = nx + ArchitectureMapNodeWidth;
			if (ny < minY) minY = ny;
			if (ny + ArchitectureMapNodeHeight > maxY)
				maxY = ny + ArchitectureMapNodeHeight;
		}

		const groupWidth = maxX - minX + GroupPaddingX * 2;
		const groupHeight = maxY - minY + GroupPaddingY * 2 + GroupHeaderHeight;

		// Normalize node positions relative to the group origin.
		for (const node of groupNodes) {
			const pos = g.node(node.id) as { x?: number; y?: number } | undefined;
			nodePositions.set(node.id, {
				x: (pos?.x ?? 0) - ArchitectureMapNodeWidth / 2 - minX + GroupPaddingX,
				y:
					(pos?.y ?? 0) -
					ArchitectureMapNodeHeight / 2 -
					minY +
					GroupPaddingY +
					GroupHeaderHeight,
			});
		}

		groupPositions.push({
			id: group.id,
			x: 0,
			y: globalY,
			width: Math.max(groupWidth, 400),
			height: groupHeight,
		});
		globalY += groupHeight + GroupGap;
	}

	const neighborhood = deriveArchitectureNeighborhood(
		model,
		options.selectedNodeId ?? null,
	);
	const traversal = new Set(options.traversalNodeIds ?? []);

	const groupNodes: Node<ArchitectureMapGroupData>[] = groupPositions.map(
		(gp) => {
			const group = model.groups.find((g) => g.id === gp.id)!;
			return {
				id: `group-${gp.id}`,
				type: "architectureGroup",
				position: { x: gp.x, y: gp.y },
				width: gp.width,
				height: gp.height,
				selectable: false,
				draggable: false,
				data: { group },
			};
		},
	);

	const memberNodes: Node<ArchitectureMapNodeData>[] = model.nodes.map(
		(node) => {
			const pos = nodePositions.get(node.id) ?? { x: 0, y: 0 };
			const gp = groupPositions.find((g) => g.id === node.group);
			return {
				id: node.id,
				type: "architecture",
				parentId: gp ? `group-${gp.id}` : undefined,
				position: pos,
				width: ArchitectureMapNodeWidth,
				height: ArchitectureMapNodeHeight,
				targetPosition: Position.Top,
				sourcePosition: Position.Bottom,
				expandParent: false,
				data: {
					node,
					selected: node.id === options.selectedNodeId,
					neighbor: neighborhood.has(node.id) && node.id !== options.selectedNodeId,
					traversal: traversal.has(node.id),
				},
			};
		},
	);

	const edges: Edge<ArchitectureMapEdgeData>[] = model.edges.map((edge) => {
		const selected = neighborhood.has(edge.from) && neighborhood.has(edge.to);
		const traversalEdge = traversal.has(edge.from) && traversal.has(edge.to);
		const emphasized = selected || traversalEdge;
		const stroke = EdgeKindColors[edge.kind] ?? "#94a3b8";
		const dash = EdgeKindDashPatterns[edge.kind];
		return {
			id: edge.id,
			source: edge.from,
			target: edge.to,
			type: "smoothstep",
			label: edge.label,
			selected: emphasized,
			animated: emphasized,
			style: {
				opacity: emphasized ? 1 : 0.35,
				strokeWidth: emphasized ? 2.5 : 1.25,
				stroke,
				strokeDasharray: dash,
			},
			data: { edge, selected, traversal: traversalEdge },
		};
	});

	return { nodes: [...groupNodes, ...memberNodes], edges };
}

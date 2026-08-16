"use client";

import * as dagre from "@dagrejs/dagre";
import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	Handle,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useRef, useState } from "react";

import { EdgeKindColors } from "#/components/reader/architecture-map-layout";
import {
	deserializeGraphFromBsol,
	serializeGraphToBsol,
} from "#/lib/architecture/bsol-serialization";
import type {
	AuthorArchitectureGraph,
	AuthorGraphEdge,
	AuthorGraphGroup,
	AuthorGraphNode,
} from "#/lib/architecture/graph-schema";

const AUTHOR_NODE_WIDTH = 200;
const AUTHOR_NODE_HEIGHT = 76;
const GROUP_PADDING = 32;
const GROUP_HEADER_HEIGHT = 24;

export interface AuthorGraphNodeData extends Record<string, unknown> {
	node: AuthorGraphNode;
	selected: boolean;
	readOnly: boolean;
}

export interface AuthorGraphGroupData extends Record<string, unknown> {
	group: AuthorGraphGroup;
}

export interface AuthorGraphEdgeData extends Record<string, unknown> {
	kind: string;
}

export interface ArchitectureGraphEditorProps {
	graph: AuthorArchitectureGraph;
	onChange?: (graph: AuthorArchitectureGraph) => void;
	readOnly?: boolean;
	height?: number;
	onSelectNode?: (node: AuthorGraphNode | null) => void;
}

interface ContextMenuState {
	x: number;
	y: number;
	nodeId?: string;
	edgeId?: string;
}

function AuthorNodeCard({ data }: NodeProps<Node<AuthorGraphNodeData>>) {
	return (
		<div
			className={[
				"h-full w-full rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-sm",
				data.selected ? "border-primary ring-2 ring-primary/50" : "border-border",
			].join(" ")}
		>
			<Handle
				type="target"
				position={Position.Top}
				isConnectable={!data.readOnly}
				className="!h-2 !w-2 !rounded-full !border-border !bg-muted-foreground"
			/>
			<div className="flex items-center justify-between gap-1.5">
				<span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
					{data.node.kind}
				</span>
				{data.node.group ? (
					<span className="rounded border border-border px-1 text-[8px] text-muted-foreground">
						{data.node.group}
					</span>
				) : null}
			</div>
			<strong className="mt-0.5 block truncate text-sm">{data.node.label}</strong>
			<Handle
				type="source"
				position={Position.Bottom}
				isConnectable={!data.readOnly}
				className="!h-2 !w-2 !rounded-full !border-border !bg-muted-foreground"
			/>
		</div>
	);
}

function AuthorGroupContainer({ data }: NodeProps<Node<AuthorGraphGroupData>>) {
	return (
		<div className="relative h-full w-full rounded-lg border border-border/50 bg-muted/20">
			<div className="absolute left-2 top-1 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
				{data.group.label}
			</div>
		</div>
	);
}

const nodeTypes = {
	authorNode: AuthorNodeCard,
	authorGroup: AuthorGroupContainer,
};

/**
 * Lay out an author graph into ReactFlow nodes and edges.
 *
 * Uses dagre (TB) for auto layout, or the author-provided `positions` map for
 * manual layout. Groups are rendered as background containers sized to their
 * member nodes.
 */
export function layoutAuthorGraph(graph: AuthorArchitectureGraph): {
	nodes: Node<AuthorGraphNodeData | AuthorGraphGroupData>[];
	edges: Edge<AuthorGraphEdgeData>[];
} {
	const useManual = graph.layout === "manual" && graph.positions;
	const nodePositions = new Map<string, { x: number; y: number }>();

	if (useManual) {
		for (const node of graph.nodes) {
			nodePositions.set(node.id, graph.positions?.[node.id] ?? { x: 0, y: 0 });
		}
	} else {
		const g = new dagre.Graph();
		g.setGraph({
			rankdir: "TB",
			nodesep: 40,
			ranksep: 80,
			marginx: 20,
			marginy: 20,
		});
		g.setDefaultEdgeLabel(() => ({}));
		for (const node of graph.nodes) {
			g.setNode(node.id, {
				width: AUTHOR_NODE_WIDTH,
				height: AUTHOR_NODE_HEIGHT,
			});
		}
		for (const edge of graph.edges) {
			if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
				g.setEdge(edge.from, edge.to, { id: edge.id });
			}
		}
		dagre.layout(g);
		for (const node of graph.nodes) {
			const pos = g.node(node.id) as { x?: number; y?: number } | undefined;
			nodePositions.set(node.id, {
				x: (pos?.x ?? 0) - AUTHOR_NODE_WIDTH / 2,
				y: (pos?.y ?? 0) - AUTHOR_NODE_HEIGHT / 2,
			});
		}
	}

	const groupNodes: Node<AuthorGraphGroupData>[] = [];
	if (graph.groups.length > 0) {
		for (const group of graph.groups) {
			const members = graph.nodes.filter((n) => n.group === group.id);
			if (members.length === 0) continue;
			let minX = Infinity;
			let minY = Infinity;
			let maxX = -Infinity;
			let maxY = -Infinity;
			for (const member of members) {
				const pos = nodePositions.get(member.id) ?? { x: 0, y: 0 };
				minX = Math.min(minX, pos.x);
				minY = Math.min(minY, pos.y);
				maxX = Math.max(maxX, pos.x + AUTHOR_NODE_WIDTH);
				maxY = Math.max(maxY, pos.y + AUTHOR_NODE_HEIGHT);
			}
			groupNodes.push({
				id: `group-${group.id}`,
				type: "authorGroup",
				position: {
					x: minX - GROUP_PADDING,
					y: minY - GROUP_PADDING - GROUP_HEADER_HEIGHT,
				},
				width: maxX - minX + GROUP_PADDING * 2,
				height: maxY - minY + GROUP_PADDING * 2 + GROUP_HEADER_HEIGHT,
				selectable: false,
				draggable: false,
				data: { group },
			});
		}
	}

	const memberNodes: Node<AuthorGraphNodeData>[] = graph.nodes.map((node) => ({
		id: node.id,
		type: "authorNode",
		position: nodePositions.get(node.id) ?? { x: 0, y: 0 },
		width: AUTHOR_NODE_WIDTH,
		height: AUTHOR_NODE_HEIGHT,
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			node,
			selected: false,
			readOnly: true,
		},
	}));

	const edges: Edge<AuthorGraphEdgeData>[] = graph.edges.map((edge) => ({
		id: edge.id,
		source: edge.from,
		target: edge.to,
		type: "smoothstep",
		label: edge.label ?? edge.kind,
		style: {
			stroke: EdgeKindColors[edge.kind] ?? "#94a3b8",
			strokeWidth: 1.5,
		},
		data: { kind: edge.kind },
	}));

	return { nodes: [...groupNodes, ...memberNodes], edges };
}

/** Convert ReactFlow state back into an author graph. */
function reactFlowToGraph(
	nodes: Node[],
	edges: Edge[],
	base: AuthorArchitectureGraph,
): AuthorArchitectureGraph {
	const authorNodes = nodes.filter((n) => n.type === "authorNode");
	const positions: Record<string, { x: number; y: number }> = {};
	const graphNodes: AuthorGraphNode[] = authorNodes.map((n) => {
		const data = n.data as AuthorGraphNodeData;
		positions[n.id] = n.position;
		return data.node;
	});
	const graphEdges: AuthorGraphEdge[] = edges.map((e) => {
		const data = e.data as AuthorGraphEdgeData | undefined;
		return {
			id: e.id,
			from: e.source,
			to: e.target,
			kind: data?.kind ?? "transforms",
			label: typeof e.label === "string" ? e.label : undefined,
		};
	});
	return {
		...base,
		nodes: graphNodes,
		edges: graphEdges,
		positions,
		layout: "manual",
	};
}

function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Editable ReactFlow graph for author-defined architecture graphs.
 *
 * In read-only mode it behaves like a viewer. In edit mode nodes are draggable,
 * connectable, deletable (right-click), and labels are editable (double-click).
 * Export/import buttons serialize to and from BSOL JSON.
 */
export function ArchitectureGraphEditor({
	graph: graphProp,
	onChange,
	readOnly = false,
	height = 420,
	onSelectNode,
}: ArchitectureGraphEditorProps) {
	const [graph, setGraph] = useState<AuthorArchitectureGraph>(graphProp);
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const initial = useMemo(() => layoutAuthorGraph(graph), [graph]);
	const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

	const syncToParent = useCallback(
		(nextNodes: Node[], nextEdges: Edge[]) => {
			const nextGraph = reactFlowToGraph(nextNodes, nextEdges, graph);
			setGraph(nextGraph);
			onChange?.(nextGraph);
		},
		[graph, onChange],
	);

	const updateNodeData = useCallback(
		(id: string, updater: (node: AuthorGraphNode) => AuthorGraphNode) => {
			setNodes((nds) => {
				const next = nds.map((n) => {
					if (n.id !== id || n.type !== "authorNode") return n;
					const data = n.data as AuthorGraphNodeData;
					return {
						...n,
						data: { ...data, node: updater(data.node) },
					};
				});
				syncToParent(next, edges);
				return next;
			});
		},
		[edges, setNodes, syncToParent],
	);

	const onNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			if (node.type !== "authorNode") return;
			const data = node.data as AuthorGraphNodeData;
			onSelectNode?.(data.node);
			setNodes((nds) =>
				nds.map((n) => {
					if (n.type !== "authorNode") return n;
					const d = n.data as AuthorGraphNodeData;
					return { ...n, data: { ...d, selected: n.id === node.id } };
				}),
			);
		},
		[onSelectNode, setNodes],
	);

	const onNodeDoubleClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			if (readOnly || node.type !== "authorNode") return;
			const data = node.data as AuthorGraphNodeData;
			const newLabel = window.prompt("Node label", data.node.label);
			if (newLabel !== null && newLabel.trim() !== "") {
				updateNodeData(node.id, (n) => ({ ...n, label: newLabel.trim() }));
			}
		},
		[readOnly, updateNodeData],
	);

	const onNodeDragStop = useCallback(() => {
		syncToParent(nodes, edges);
	}, [nodes, edges, syncToParent]);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (readOnly || !connection.source || !connection.target) return;
			const id = `edge-${Date.now()}`;
			const kind = "transforms";
			const newEdge: Edge<AuthorGraphEdgeData> = {
				id,
				source: connection.source,
				target: connection.target,
				type: "smoothstep",
				label: kind,
				style: {
					stroke: EdgeKindColors[kind] ?? "#94a3b8",
					strokeWidth: 1.5,
				},
				data: { kind },
			};
			setEdges((eds) => addEdge(newEdge, eds));
			syncToParent(nodes, [...edges, newEdge]);
		},
		[readOnly, nodes, edges, setEdges, syncToParent],
	);

	const onNodesDelete = useCallback(
		(deleted: Node[]) => {
			if (readOnly) return;
			const deletedIds = new Set(deleted.map((n) => n.id));
			const nextNodes = nodes.filter((n) => !deletedIds.has(n.id));
			const nextEdges = edges.filter(
				(e) => !deletedIds.has(e.source) && !deletedIds.has(e.target),
			);
			setNodes(nextNodes);
			setEdges(nextEdges);
			syncToParent(nextNodes, nextEdges);
		},
		[readOnly, nodes, edges, setNodes, setEdges, syncToParent],
	);

	const onEdgesDelete = useCallback(
		(deleted: Edge[]) => {
			if (readOnly) return;
			const deletedIds = new Set(deleted.map((e) => e.id));
			const nextEdges = edges.filter((e) => !deletedIds.has(e.id));
			setEdges(nextEdges);
			syncToParent(nodes, nextEdges);
		},
		[readOnly, nodes, edges, setEdges, syncToParent],
	);

	const onNodeContextMenu = useCallback(
		(e: React.MouseEvent, node: Node) => {
			if (readOnly) return;
			e.preventDefault();
			setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
		},
		[readOnly],
	);

	const onEdgeContextMenu = useCallback(
		(e: React.MouseEvent, edge: Edge) => {
			if (readOnly) return;
			e.preventDefault();
			setContextMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id });
		},
		[readOnly],
	);

	const onPaneClick = useCallback(() => {
		setContextMenu(null);
		onSelectNode?.(null);
		setNodes((nds) =>
			nds.map((n) => {
				if (n.type !== "authorNode") return n;
				const d = n.data as AuthorGraphNodeData;
				return { ...n, data: { ...d, selected: false } };
			}),
		);
	}, [onSelectNode, setNodes]);

	const addNode = useCallback(() => {
		if (readOnly) return;
		const id = `node-${Date.now()}`;
		const newNode: Node<AuthorGraphNodeData> = {
			id,
			type: "authorNode",
			position: {
				x: Math.random() * 200,
				y: Math.random() * 200,
			},
			width: AUTHOR_NODE_WIDTH,
			height: AUTHOR_NODE_HEIGHT,
			targetPosition: Position.Top,
			sourcePosition: Position.Bottom,
			data: {
				node: { id, label: "New node", kind: "process" },
				selected: false,
				readOnly,
			},
		};
		setNodes((nds) => [...nds, newNode]);
		syncToParent([...nodes, newNode], edges);
	}, [readOnly, nodes, edges, setNodes, syncToParent]);

	const handleExport = useCallback(() => {
		const bsol = serializeGraphToBsol(reactFlowToGraph(nodes, edges, graph));
		const blob = new Blob([bsol], { type: "application/json" });
		triggerDownload(blob, `${graph.id || "architecture-graph"}.bsol.json`);
	}, [nodes, edges, graph]);

	const handleImportFile = useCallback(
		(file: File) => {
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const imported = deserializeGraphFromBsol(reader.result as string);
					setGraph(imported);
					const layout = layoutAuthorGraph(imported);
					setNodes(layout.nodes);
					setEdges(layout.edges);
					onChange?.(imported);
				} catch (err) {
					console.error("Failed to import BSOL graph", err);
				}
			};
			reader.readAsText(file);
		},
		[onChange, setNodes, setEdges],
	);

	const handleLinkToArchitecture = useCallback(() => {
		if (graph.id) {
			window.open(
				`/api/v1/architecture/${encodeURIComponent(graph.id)}`,
				"_blank",
				"noopener,noreferrer",
			);
		}
	}, [graph.id]);

	const deleteContextItem = useCallback(() => {
		if (!contextMenu) return;
		if (contextMenu.nodeId) {
			onNodesDelete([{ id: contextMenu.nodeId } as Node]);
		} else if (contextMenu.edgeId) {
			onEdgesDelete([{ id: contextMenu.edgeId } as Edge]);
		}
		setContextMenu(null);
	}, [contextMenu, onNodesDelete, onEdgesDelete]);

	return (
		<div className="space-y-2">
			{!readOnly ? (
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={addNode}
						className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
					>
						Add node
					</button>
					<button
						type="button"
						onClick={handleExport}
						className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
					>
						Export BSOL
					</button>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
					>
						Import BSOL
					</button>
					<button
						type="button"
						onClick={handleLinkToArchitecture}
						className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
					>
						Link to architecture
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="application/json,.json"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) handleImportFile(file);
							e.target.value = "";
						}}
					/>
				</div>
			) : null}
			<div className="rounded-lg border border-border" style={{ height }}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onNodeClick={onNodeClick}
					onNodeDoubleClick={onNodeDoubleClick}
					onNodeDragStop={onNodeDragStop}
					onConnect={onConnect}
					onNodesDelete={onNodesDelete}
					onEdgesDelete={onEdgesDelete}
					onNodeContextMenu={onNodeContextMenu}
					onEdgeContextMenu={onEdgeContextMenu}
					onPaneClick={onPaneClick}
					fitView
					nodesDraggable={!readOnly}
					nodesConnectable={!readOnly}
					elementsSelectable
					deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
					panOnDrag
					zoomOnScroll
					zoomOnPinch
					minZoom={0.2}
					proOptions={{ hideAttribution: true }}
				>
					<Background gap={16} size={0.5} />
					<Controls showInteractive={false} />
				</ReactFlow>
			</div>
			{contextMenu ? (
				<div
					className="fixed z-50 rounded-md border border-border bg-card py-1 text-xs shadow-lg"
					style={{ left: contextMenu.x, top: contextMenu.y }}
				>
					<button
						type="button"
						className="block w-full px-4 py-1.5 text-left text-destructive hover:bg-destructive/10"
						onClick={deleteContextItem}
					>
						Delete {contextMenu.nodeId ? "node" : "edge"}
					</button>
				</div>
			) : null}
		</div>
	);
}

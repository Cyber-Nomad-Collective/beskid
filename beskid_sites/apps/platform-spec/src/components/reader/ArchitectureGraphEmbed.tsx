"use client";

import {
	Background,
	Controls,
	Handle,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";

import {
	type ArchitectureMapGroupData,
	type ArchitectureMapNodeData,
	layoutArchitectureMap,
} from "#/components/reader/architecture-map-layout";
import type {
	ArchitectureCatalogEntry,
	ArchitectureManifest,
} from "#/lib/architecture/architecture-model";
import { resolveArchitectureModel } from "#/lib/architecture/architecture-model";

export interface ArchitectureGraphEmbedProps {
	manifest: ArchitectureManifest;
	catalog?: ArchitectureCatalogEntry[];
	height?: number;
	/**
	 * When true, nodes can be dragged to adjust the layout, but cannot be
	 * connected or deleted — the embed remains a view, not an editor.
	 */
	editable?: boolean;
}

function EmbedNodeCard({ data }: NodeProps<Node<ArchitectureMapNodeData>>) {
	return (
		<div
			className={[
				"h-full w-full rounded-md border bg-card px-2 py-1.5 text-xs shadow-sm",
				data.selected ? "border-primary ring-1 ring-primary/50" : "border-border",
			].join(" ")}
		>
			<Handle
				type="target"
				position={Position.Top}
				isConnectable={false}
				aria-hidden
				className="!h-0 !w-0 !border-0 !bg-transparent !opacity-0"
			/>
			<span className="text-[9px] font-semibold uppercase text-muted-foreground">
				{data.node.kind}
			</span>
			<strong className="mt-0.5 block truncate">{data.node.label}</strong>
			<Handle
				type="source"
				position={Position.Bottom}
				isConnectable={false}
				aria-hidden
				className="!h-0 !w-0 !border-0 !bg-transparent !opacity-0"
			/>
		</div>
	);
}

function EmbedGroupContainer({
	data,
}: NodeProps<Node<ArchitectureMapGroupData>>) {
	return (
		<div className="relative h-full w-full rounded-lg border border-border/50 bg-muted/20">
			<div className="absolute left-2 top-1 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
				{data.group.label}
			</div>
		</div>
	);
}

const nodeTypes = {
	architecture: EmbedNodeCard,
	architectureGroup: EmbedGroupContainer,
};

/**
 * Compact, embeddable architecture graph for inline spec display.
 * Hydrates <beskid-doc-embed kind="graph"> custom elements in the reader.
 */
export function ArchitectureGraphEmbed({
	manifest,
	catalog = [],
	height = 420,
	editable = false,
}: ArchitectureGraphEmbedProps) {
	const model = useMemo(
		() => resolveArchitectureModel(manifest, catalog),
		[manifest, catalog],
	);

	const { nodes, edges } = useMemo(() => layoutArchitectureMap(model), [model]);

	return (
		<div className="rounded-lg border border-border" style={{ height }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				fitView
				nodesDraggable={editable}
				nodesConnectable={false}
				elementsSelectable
				deleteKeyCode={null}
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
	);
}

"use client";

import {
	Background,
	Controls,
	Handle,
	Position,
	ReactFlow,
	type Node,
	type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";

import {
	EdgeKindColors,
	layoutArchitectureMap,
	type ArchitectureMapGroupData,
	type ArchitectureMapNodeData,
} from "#/components/reader/architecture-map-layout";
import type {
	ResolvedArchitectureModel,
	ResolvedArchitectureNode,
} from "#/lib/architecture/architecture-model";

const TraversalLabels = {
	build: "Build",
	ide: "IDE",
	"spec-to-code": "Spec-to-code",
} as const;

function ArchitectureNodeCard({ data }: NodeProps<Node<ArchitectureMapNodeData>>) {
	const specLink = data.node.specLinks.find((link) => link.available && link.href);
	return (
		<div
			className={[
				"h-full w-full rounded-lg border bg-card px-3 py-2 shadow-sm",
				data.selected ? "border-primary ring-2 ring-primary/50" : "border-border",
				data.neighbor ? "border-primary/60 bg-primary/5" : "",
				data.traversal ? "outline outline-1 outline-amber-500/70" : "",
			].join(" ")}
		>
			<Handle
				type="target"
				position={Position.Top}
				isConnectable={false}
				aria-hidden="true"
				className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
			/>
			<div className="flex items-start justify-between gap-2">
				<span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
					{data.node.kind}
				</span>
				<span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
					{data.node.state}
				</span>
			</div>
			<strong className="mt-2 block truncate text-sm">{data.node.label}</strong>
			{specLink?.href ? (
				<a
					href={specLink.href}
					onClick={(event) => event.stopPropagation()}
					className="mt-1 block truncate text-xs text-primary underline-offset-2 hover:underline"
				>
					{specLink.title ?? specLink.capability}
				</a>
			) : (
				<span className="mt-1 block text-xs text-muted-foreground">No canonical spec link</span>
			)}
			<Handle
				type="source"
				position={Position.Bottom}
				isConnectable={false}
				aria-hidden="true"
				className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
			/>
		</div>
	);
}

function ArchitectureGroupContainer({ data }: NodeProps<Node<ArchitectureMapGroupData>>) {
	return (
		<div className="relative h-full w-full rounded-xl border-2 border-border/60 bg-muted/30">
			<div className="absolute left-3 top-2 rounded-md bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{data.group.label}
			</div>
		</div>
	);
}

const nodeTypes = { architecture: ArchitectureNodeCard, architectureGroup: ArchitectureGroupContainer };

function ArchitectureDetail({ node }: { node: ResolvedArchitectureNode | null }) {
	if (!node) {
		return (
			<aside className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
				Select a component to inspect its architecture role, evidence, and canonical specification links.
			</aside>
		);
	}
	return (
		<aside className="space-y-4 rounded-lg border border-border bg-card p-4">
			<div>
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{node.group} · {node.kind} · {node.state}</p>
				<h3 className="mt-1 text-lg font-semibold">{node.label}</h3>
				<p className="mt-2 text-sm text-muted-foreground">{node.description}</p>
			</div>
			{node.metadata && Object.keys(node.metadata).length > 0 ? (
				<div>
					<h4 className="text-sm font-semibold">Metadata</h4>
					<dl className="mt-1 space-y-1 text-sm">
						{Object.entries(node.metadata).map(([key, value]) => (
							<div key={key} className="flex justify-between gap-3">
								<dt className="text-muted-foreground">{key}</dt>
								<dd className="text-right">{value}</dd>
							</div>
						))}
					</dl>
				</div>
			) : null}
			<div>
				<h4 className="text-sm font-semibold">Source paths</h4>
				<ul className="mt-1 space-y-1 text-sm text-muted-foreground">
					{node.sourcePaths.map((path) => <li key={path}><code>{path}</code></li>)}
				</ul>
			</div>
			<div>
				<h4 className="text-sm font-semibold">Canonical specification</h4>
				<ul className="mt-1 space-y-1 text-sm">
					{node.specLinks.length > 0 ? node.specLinks.map((link) => (
						<li key={link.capability}>
							{link.available && link.href ? <a className="text-primary underline-offset-2 hover:underline" href={link.href}>{link.title ?? link.capability}</a> : <span className="text-muted-foreground">{link.capability} (not catalogued)</span>}
						</li>
					)) : <li className="text-muted-foreground">No capability applies.</li>}
				</ul>
			</div>
		</aside>
	);
}

export function CompilerArchitectureMap({ model }: { model: ResolvedArchitectureModel }) {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [traversalId, setTraversalId] = useState<keyof typeof TraversalLabels | null>(null);
	const selectedNode = selectedNodeId ? model.nodesById[selectedNodeId] ?? null : null;
	const { nodes, edges } = useMemo(
		() => layoutArchitectureMap(model, { selectedNodeId, traversalNodeIds: traversalId ? model.traversals[traversalId] : [] }),
		[model, selectedNodeId, traversalId],
	);
	const selectNode = useCallback((_: React.MouseEvent, node: Node) => setSelectedNodeId(node.id), []);

	const edgeKinds = useMemo(() => {
		const kinds = new Set(model.edges.map((e) => e.kind));
		return [...kinds].sort();
	}, [model.edges]);

	return (
		<section className="space-y-3" aria-label="Compiler architecture map">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold">Compiler architecture map</h2>
					<p className="text-sm text-muted-foreground">
						Read-only compiler relationships from the canonical architecture manifest.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<label className="text-sm text-muted-foreground" htmlFor="traversal-select">
						Traversal:
					</label>
					<select
						id="traversal-select"
						className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
						value={traversalId ?? ""}
						onChange={(e) => {
							const val = e.target.value;
							setTraversalId(val ? (val as keyof typeof TraversalLabels) : null);
						}}
					>
						<option value="">None</option>
						{(Object.keys(TraversalLabels) as Array<keyof typeof TraversalLabels>).map((id) => (
							<option key={id} value={id}>
								{TraversalLabels[id]}
							</option>
						))}
					</select>
				</div>
			</div>
			{edgeKinds.length > 0 ? (
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span className="font-semibold">Edge kinds:</span>
					{edgeKinds.map((kind) => (
						<span key={kind} className="inline-flex items-center gap-1.5">
							<span
								className="inline-block h-0.5 w-5 rounded"
								style={{
									backgroundColor: EdgeKindColors[kind] ?? "#94a3b8",
								}}
							/>
							{kind}
						</span>
					))}
				</div>
			) : null}
			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_19rem]">
				<div className="h-[600px] rounded-lg border border-border">
					<ReactFlow
						nodes={nodes}
						edges={edges}
						nodeTypes={nodeTypes}
						onNodeClick={selectNode}
						fitView
						nodesDraggable={false}
						nodesConnectable={false}
						elementsSelectable
						deleteKeyCode={null}
						panOnDrag
						zoomOnScroll
						zoomOnPinch
						minZoom={0.25}
						proOptions={{ hideAttribution: true }}
					>
						<Background gap={20} size={1} />
						<Controls showInteractive={false} />
					</ReactFlow>
				</div>
				<ArchitectureDetail node={selectedNode} />
			</div>
		</section>
	);
}

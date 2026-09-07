import type { GraphNode } from "gitnexus-shared";
import type Graph from "graphology";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";
import {
	Focus,
	Lightbulb,
	LightbulbOff,
	Maximize2,
	Pause,
	Play,
	RotateCcw,
	ZoomIn,
	ZoomOut,
} from "@/lib/lucide-icons";
import { useAppState } from "../hooks/useAppState";
import { useSigma } from "../hooks/useSigma";
import {
	filterGraphByDepth,
	knowledgeGraphToGraphology,
	type SigmaEdgeAttributes,
	type SigmaNodeAttributes,
} from "../lib/graph-adapter";

export interface GraphCanvasHandle {
	focusNode: (nodeId: string) => void;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle>((_, ref) => {
	const {
		graph,
		setSelectedNode,
		selectedNode: appSelectedNode,
		visibleLabels,
		visibleEdgeTypes,
		openCodePanel,
		depthFilter,
		highlightedNodeIds,
		setHighlightedNodeIds,
		aiCitationHighlightedNodeIds,
		aiToolHighlightedNodeIds,
		blastRadiusNodeIds,
		isAIHighlightsEnabled,
		toggleAIHighlights,
		clearAIToolHighlights,
		clearAICitationHighlights,
		clearBlastRadius,
		animatedNodes,
	} = useAppState();
	const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);

	const effectiveHighlightedNodeIds = useMemo(() => {
		if (!isAIHighlightsEnabled) return highlightedNodeIds;
		const next = new Set(highlightedNodeIds);
		for (const id of aiCitationHighlightedNodeIds) next.add(id);
		for (const id of aiToolHighlightedNodeIds) next.add(id);
		// Note: blast radius nodes are handled separately with red color
		return next;
	}, [
		highlightedNodeIds,
		aiCitationHighlightedNodeIds,
		aiToolHighlightedNodeIds,
		isAIHighlightsEnabled,
	]);

	// Blast radius nodes (only when AI highlights enabled)
	const effectiveBlastRadiusNodeIds = useMemo(() => {
		if (!isAIHighlightsEnabled) return new Set<string>();
		return blastRadiusNodeIds;
	}, [blastRadiusNodeIds, isAIHighlightsEnabled]);

	// Animated nodes (only when AI highlights enabled)
	const effectiveAnimatedNodes = useMemo(() => {
		if (!isAIHighlightsEnabled) return new Map();
		return animatedNodes;
	}, [animatedNodes, isAIHighlightsEnabled]);

	const nodeById = useMemo(() => {
		if (!graph) return new Map<string, GraphNode>();
		return new Map(graph.nodes.map((n) => [n.id, n]));
	}, [graph]);

	const handleNodeClick = useCallback(
		(nodeId: string) => {
			if (!graph) return;
			const node = nodeById.get(nodeId);
			if (node) {
				setSelectedNode(node);
				openCodePanel();
			}
		},
		[graph, nodeById, setSelectedNode, openCodePanel],
	);

	const handleNodeHover = useCallback(
		(nodeId: string | null) => {
			if (!nodeId || !graph) {
				setHoveredNodeName(null);
				return;
			}
			const node = nodeById.get(nodeId);
			setHoveredNodeName(node ? node.properties.name : null);
		},
		[graph, nodeById],
	);

	const handleStageClick = useCallback(() => {
		setSelectedNode(null);
	}, [setSelectedNode]);

	const {
		containerRef,
		sigmaRef,
		setGraph: setSigmaGraph,
		zoomIn,
		zoomOut,
		resetZoom,
		focusNode,
		isLayoutRunning,
		startLayout,
		stopLayout,
		selectedNode: sigmaSelectedNode,
		setSelectedNode: setSigmaSelectedNode,
	} = useSigma({
		onNodeClick: handleNodeClick,
		onNodeHover: handleNodeHover,
		onStageClick: handleStageClick,
		highlightedNodeIds: effectiveHighlightedNodeIds,
		blastRadiusNodeIds: effectiveBlastRadiusNodeIds,
		animatedNodes: effectiveAnimatedNodes,
		visibleEdgeTypes,
	});

	const handleToggleAIHighlights = useCallback(() => {
		if (isAIHighlightsEnabled) {
			clearAIToolHighlights();
			clearAICitationHighlights();
			clearBlastRadius();
			setSelectedNode(null);
			setSigmaSelectedNode(null);
		}
		toggleAIHighlights();
	}, [
		isAIHighlightsEnabled,
		clearAIToolHighlights,
		clearAICitationHighlights,
		clearBlastRadius,
		setSelectedNode,
		toggleAIHighlights,
		setSigmaSelectedNode,
	]);

	// Expose focusNode to parent via ref
	useImperativeHandle(
		ref,
		() => ({
			focusNode: (nodeId: string) => {
				// Also update app state so the selection syncs properly
				if (graph) {
					const node = nodeById.get(nodeId);
					if (node) {
						setSelectedNode(node);
						openCodePanel();
					}
				}
				focusNode(nodeId);
			},
		}),
		[focusNode, graph, nodeById, setSelectedNode, openCodePanel],
	);

	// Update Sigma graph when KnowledgeGraph changes
	useEffect(() => {
		if (!graph) return;

		// Build communityMemberships map from MEMBER_OF relationships
		// MEMBER_OF edges: nodeId -> communityId (stored as targetId)
		const communityMemberships = new Map<string, number>();
		graph.relationships.forEach((rel) => {
			if (rel.type === "MEMBER_OF") {
				// Find the community node to get its index
				const communityNode = nodeById.get(rel.targetId);
				if (communityNode && communityNode.label === "Community") {
					// Extract community index from id (e.g., "comm_5" -> 5)
					const numericPart = rel.targetId.replace("comm_", "");
					const communityIdx = /^\d+$/.test(numericPart)
						? parseInt(numericPart, 10)
						: 0;
					communityMemberships.set(rel.sourceId, communityIdx);
				}
			}
		});

		const sigmaGraph = knowledgeGraphToGraphology(graph, communityMemberships);
		setSigmaGraph(sigmaGraph);
	}, [graph, nodeById, setSigmaGraph]);

	// Update node visibility when filters change
	useEffect(() => {
		const sigma = sigmaRef.current;
		if (!sigma) return;

		const sigmaGraph = sigma.getGraph() as Graph<
			SigmaNodeAttributes,
			SigmaEdgeAttributes
		>;
		if (sigmaGraph.order === 0) return; // Don't filter empty graph

		filterGraphByDepth(
			sigmaGraph,
			appSelectedNode?.id || null,
			depthFilter,
			visibleLabels,
		);
		sigma.refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- sigmaRef identity never changes
	}, [visibleLabels, depthFilter, appSelectedNode, sigmaRef.current]);

	// Sync app selected node with sigma
	useEffect(() => {
		if (appSelectedNode) {
			setSigmaSelectedNode(appSelectedNode.id);
		} else {
			setSigmaSelectedNode(null);
		}
	}, [appSelectedNode, setSigmaSelectedNode]);

	// Focus on selected node
	const handleFocusSelected = useCallback(() => {
		if (appSelectedNode) {
			focusNode(appSelectedNode.id);
		}
	}, [appSelectedNode, focusNode]);

	// Clear selection
	const handleClearSelection = useCallback(() => {
		setSelectedNode(null);
		setSigmaSelectedNode(null);
		resetZoom();
	}, [setSelectedNode, setSigmaSelectedNode, resetZoom]);

	return (
		<div className="relative h-full w-full bg-background">
			{/* Background gradient */}
			<div className="pointer-events-none absolute inset-0">
				<div
					className="absolute inset-0"
					style={{
						background: `
              radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.03) 0%, transparent 70%),
              linear-gradient(to bottom, #06060a, #0a0a10)
            `,
					}}
				/>
			</div>

			{/* Sigma container */}
			<div
				ref={containerRef}
				data-testid="graph-canvas"
				className="sigma-container h-full w-full cursor-grab active:cursor-grabbing"
			/>

			{/* Hovered node tooltip - only show when NOT selected */}
			{hoveredNodeName && !sigmaSelectedNode && (
				<div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 animate-fade-in rounded-lg border border-border bg-muted/95 px-3 py-1.5 backdrop-blur-sm">
					<span className="font-mono text-sm text-foreground">
						{hoveredNodeName}
					</span>
				</div>
			)}

			{/* Selection info bar */}
			{sigmaSelectedNode && appSelectedNode && (
				<div className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 animate-slide-up items-center gap-2 rounded-xl border border-primary/30 bg-primary/20 px-4 py-2 backdrop-blur-sm">
					<div className="h-2 w-2 animate-pulse rounded-full bg-primary/10" />
					<span className="font-mono text-sm text-foreground">
						{appSelectedNode.properties.name}
					</span>
					<span className="text-xs text-muted-foreground">
						({appSelectedNode.label})
					</span>
					<button
						onClick={handleClearSelection}
						className="ml-2 rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
					>
						Clear
					</button>
				</div>
			)}

			{/* Graph Controls - Bottom Right */}
			<div className="absolute right-4 bottom-4 z-10 flex flex-col gap-1">
				<button
					onClick={zoomIn}
					className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Zoom In"
				>
					<ZoomIn className="h-4 w-4" />
				</button>
				<button
					onClick={zoomOut}
					className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Zoom Out"
				>
					<ZoomOut className="h-4 w-4" />
				</button>
				<button
					onClick={resetZoom}
					className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Fit to Screen"
				>
					<Maximize2 className="h-4 w-4" />
				</button>

				{/* Divider */}
				<div className="my-1 h-px bg-border" />

				{/* Focus on selected */}
				{appSelectedNode && (
					<button
						onClick={handleFocusSelected}
						className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/20 text-primary transition-colors hover:bg-primary/30"
						title="Focus on Selected Node"
					>
						<Focus className="h-4 w-4" />
					</button>
				)}

				{/* Clear selection */}
				{sigmaSelectedNode && (
					<button
						onClick={handleClearSelection}
						className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						title="Clear Selection"
					>
						<RotateCcw className="h-4 w-4" />
					</button>
				)}

				{/* Divider */}
				<div className="my-1 h-px bg-border" />

				{/* Layout control */}
				<button
					onClick={isLayoutRunning ? stopLayout : startLayout}
					className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all ${
						isLayoutRunning
							? "animate-pulse border-primary bg-primary/10 text-white shadow-glow"
							: "border-border bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"
					} `}
					title={isLayoutRunning ? "Stop Layout" : "Run Layout Again"}
				>
					{isLayoutRunning ? (
						<Pause className="h-4 w-4" />
					) : (
						<Play className="h-4 w-4" />
					)}
				</button>
			</div>

			{/* Layout running indicator */}
			{isLayoutRunning && (
				<div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 animate-fade-in items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 backdrop-blur-sm">
					<div className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
					<span className="text-xs font-medium text-emerald-400">
						Layout optimizing...
					</span>
				</div>
			)}

			{/* AI Highlights toggle - Top Right */}
			<div className="absolute top-4 right-4 z-20">
				<button
					onClick={handleToggleAIHighlights}
					className={
						isAIHighlightsEnabled
							? "flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 text-primary transition-colors hover:border-primary/60 hover:bg-primary/20"
							: "flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					}
					title={
						isAIHighlightsEnabled
							? "Turn off all highlights"
							: "Turn on AI highlights"
					}
					data-testid="ai-highlights-toggle"
				>
					{isAIHighlightsEnabled ? (
						<Lightbulb className="h-4 w-4" />
					) : (
						<LightbulbOff className="h-4 w-4" />
					)}
				</button>
			</div>
		</div>
	);
});

GraphCanvas.displayName = "GraphCanvas";

import type { GraphNode, NodeLabel, PipelineProgress } from "gitnexus-shared";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ERROR_RESET_DELAY_MS } from "../config/ui-constants";
import { createKnowledgeGraph } from "../core/graph/graph";
import type { KnowledgeGraph } from "../core/graph/types";
import type { EdgeType } from "../lib/constants";
import { normalizePath } from "../lib/path-resolution";
import {
	type BackendRepo,
	runQuery as backendRunQuery,
	search as backendSearch,
	startEmbeddings as backendStartEmbeddings,
	type ConnectResult,
	connectToServer,
	type JobProgress,
	probeBackend,
	streamEmbeddingProgress,
} from "../services/backend-client";
import { GraphStateProvider, useGraphState } from "./app-state/graph";

export type ViewMode = "loading" | "exploring";
export type EmbeddingStatus =
	| "idle"
	| "loading"
	| "embedding"
	| "indexing"
	| "ready"
	| "error";

export interface QueryResult {
	rows: Record<string, unknown>[];
	nodeIds: string[];
	executionTime: number;
}

export type AnimationType = "pulse" | "ripple" | "glow";

export interface NodeAnimation {
	type: AnimationType;
	startTime: number;
	duration: number;
}

export interface CodeReference {
	id: string;
	filePath: string;
	startLine?: number;
	endLine?: number;
	nodeId?: string;
	label?: string;
	name?: string;
	source: "ai" | "user";
}

export interface CodeReferenceFocus {
	filePath: string;
	startLine?: number;
	endLine?: number;
	ts: number;
}

interface AppState {
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
	graph: KnowledgeGraph | null;
	setGraph: (graph: KnowledgeGraph | null) => void;
	selectedNode: GraphNode | null;
	setSelectedNode: (node: GraphNode | null) => void;
	openCodePanel: () => void;
	visibleLabels: NodeLabel[];
	toggleLabelVisibility: (label: NodeLabel) => void;
	visibleEdgeTypes: EdgeType[];
	toggleEdgeVisibility: (edgeType: EdgeType) => void;
	depthFilter: number | null;
	setDepthFilter: (depth: number | null) => void;
	highlightedNodeIds: Set<string>;
	setHighlightedNodeIds: (ids: Set<string>) => void;
	aiCitationHighlightedNodeIds: Set<string>;
	aiToolHighlightedNodeIds: Set<string>;
	blastRadiusNodeIds: Set<string>;
	isAIHighlightsEnabled: boolean;
	toggleAIHighlights: () => void;
	clearAIToolHighlights: () => void;
	clearAICitationHighlights: () => void;
	clearBlastRadius: () => void;
	queryResult: QueryResult | null;
	setQueryResult: (result: QueryResult | null) => void;
	clearQueryHighlights: () => void;
	animatedNodes: Map<string, NodeAnimation>;
	triggerNodeAnimation: (nodeIds: string[], type: AnimationType) => void;
	clearAnimations: () => void;
	progress: PipelineProgress | null;
	setProgress: (progress: PipelineProgress | null) => void;
	projectName: string;
	setProjectName: (name: string) => void;
	serverBaseUrl: string | null;
	setServerBaseUrl: (url: string | null) => void;
	availableRepos: BackendRepo[];
	setAvailableRepos: (repos: BackendRepo[]) => void;
	switchRepo: (repoName: string) => Promise<void>;
	setCurrentRepo: (repoName: string) => void;
	runQuery: (cypher: string) => Promise<unknown[]>;
	isDatabaseReady: () => Promise<boolean>;
	embeddingStatus: EmbeddingStatus;
	embeddingProgress: { phase: string; percent: number } | null;
	startEmbeddings: () => Promise<void>;
	startEmbeddingsWithFallback: () => void;
	semanticSearch: (query: string, k?: number) => Promise<unknown[]>;
	semanticSearchWithContext: (
		query: string,
		k?: number,
		hops?: number,
	) => Promise<unknown[]>;
	isEmbeddingReady: boolean;
	codeReferences: CodeReference[];
	isCodePanelOpen: boolean;
	setCodePanelOpen: (open: boolean) => void;
	addCodeReference: (ref: Omit<CodeReference, "id">) => void;
	removeCodeReference: (id: string) => void;
	clearAICodeReferences: () => void;
	clearCodeReferences: () => void;
	codeReferenceFocus: CodeReferenceFocus | null;
}

const AppStateContext = createContext<AppState | null>(null);

export const AppStateProvider = ({ children }: { children: ReactNode }) => (
	<GraphStateProvider>
		<AppStateProviderInner>{children}</AppStateProviderInner>
	</GraphStateProvider>
);

const AppStateProviderInner = ({ children }: { children: ReactNode }) => {
	const [viewMode, setViewMode] = useState<ViewMode>("loading");

	const {
		graph,
		setGraph,
		selectedNode,
		setSelectedNode,
		visibleLabels,
		toggleLabelVisibility,
		visibleEdgeTypes,
		toggleEdgeVisibility,
		depthFilter,
		setDepthFilter,
		highlightedNodeIds,
		setHighlightedNodeIds,
	} = useGraphState();

	const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
	const [aiCitationHighlightedNodeIds, setAICitationHighlightedNodeIds] =
		useState<Set<string>>(new Set());
	const [aiToolHighlightedNodeIds, setAIToolHighlightedNodeIds] = useState<
		Set<string>
	>(new Set());
	const [blastRadiusNodeIds, setBlastRadiusNodeIds] = useState<Set<string>>(
		new Set(),
	);
	const [isAIHighlightsEnabled, setAIHighlightsEnabled] = useState(true);

	const toggleAIHighlights = useCallback(() => {
		setAIHighlightsEnabled((prev) => !prev);
	}, []);

	const clearAIToolHighlights = useCallback(() => {
		setAIToolHighlightedNodeIds(new Set());
	}, []);

	const clearAICitationHighlights = useCallback(() => {
		setAICitationHighlightedNodeIds(new Set());
	}, []);

	const clearBlastRadius = useCallback(() => {
		setBlastRadiusNodeIds(new Set());
	}, []);

	const clearQueryHighlights = useCallback(() => {
		setHighlightedNodeIds(new Set());
		setQueryResult(null);
	}, [setHighlightedNodeIds]);

	const [animatedNodes, setAnimatedNodes] = useState<Map<string, NodeAnimation>>(
		new Map(),
	);
	const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const triggerNodeAnimation = useCallback(
		(nodeIds: string[], type: AnimationType) => {
			const now = Date.now();
			const duration = type === "pulse" ? 2000 : type === "ripple" ? 3000 : 4000;

			setAnimatedNodes((prev) => {
				const next = new Map(prev);
				for (const id of nodeIds) {
					next.set(id, { type, startTime: now, duration });
				}
				return next;
			});

			setTimeout(() => {
				setAnimatedNodes((prev) => {
					const next = new Map(prev);
					for (const id of nodeIds) {
						const anim = next.get(id);
						if (anim && anim.startTime === now) {
							next.delete(id);
						}
					}
					return next;
				});
			}, duration + 100);
		},
		[],
	);

	const clearAnimations = useCallback(() => {
		setAnimatedNodes(new Map());
		if (animationTimerRef.current) {
			clearInterval(animationTimerRef.current);
			animationTimerRef.current = null;
		}
	}, []);

	const [progress, setProgress] = useState<PipelineProgress | null>(null);
	const [projectName, setProjectName] = useState<string>("");
	const [serverBaseUrl, setServerBaseUrl] = useState<string | null>(null);
	const [availableRepos, setAvailableRepos] = useState<BackendRepo[]>([]);
	const [embeddingStatus, setEmbeddingStatus] =
		useState<EmbeddingStatus>("idle");
	const [embeddingProgress, setEmbeddingProgress] = useState<{
		phase: string;
		percent: number;
	} | null>(null);

	const [codeReferences, setCodeReferences] = useState<CodeReference[]>([]);
	const [isCodePanelOpen, setCodePanelOpen] = useState(false);
	const [codeReferenceFocus, setCodeReferenceFocus] =
		useState<CodeReferenceFocus | null>(null);

	const openCodePanel = useCallback(() => {
		setCodePanelOpen(true);
	}, []);

	const _fileNodeByPath = useMemo(() => {
		if (!graph) return new Map<string, string>();
		const map = new Map<string, string>();
		for (const n of graph.nodes) {
			if (n.label === "File") {
				map.set(normalizePath(n.properties.filePath), n.id);
			}
		}
		return map;
	}, [graph]);

	const addCodeReference = useCallback((ref: Omit<CodeReference, "id">) => {
		const id = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const newRef: CodeReference = { ...ref, id };

		setCodeReferences((prev) => {
			const isDuplicate = prev.some(
				(r) =>
					r.filePath === ref.filePath &&
					r.startLine === ref.startLine &&
					r.endLine === ref.endLine,
			);
			if (isDuplicate) return prev;
			return [...prev, newRef];
		});

		setCodePanelOpen(true);
		setCodeReferenceFocus({
			filePath: ref.filePath,
			startLine: ref.startLine,
			endLine: ref.endLine,
			ts: Date.now(),
		});

		if (ref.nodeId && ref.source === "ai") {
			setAICitationHighlightedNodeIds((prev) => new Set([...prev, ref.nodeId!]));
		}
	}, []);

	const clearAICodeReferences = useCallback(() => {
		setCodeReferences((prev) => {
			const removed = prev.filter((r) => r.source === "ai");
			const kept = prev.filter((r) => r.source !== "ai");
			const removedNodeIds = new Set(
				removed.map((r) => r.nodeId).filter(Boolean) as string[],
			);
			if (removedNodeIds.size > 0) {
				setAICitationHighlightedNodeIds((prevIds) => {
					const next = new Set(prevIds);
					for (const id of removedNodeIds) next.delete(id);
					return next;
				});
			}
			if (kept.length === 0 && !selectedNode) {
				setCodePanelOpen(false);
			}
			return kept;
		});
	}, [selectedNode]);

	useEffect(() => {
		if (!selectedNode) return;
		setCodePanelOpen(true);
	}, [selectedNode]);

	const repoRef = useRef<string | undefined>(undefined);

	const setCurrentRepo = useCallback((repoName: string) => {
		repoRef.current = repoName;
	}, []);

	const runQuery = useCallback(async (cypher: string): Promise<unknown[]> => {
		return backendRunQuery(cypher, repoRef.current);
	}, []);

	const isDatabaseReady = useCallback(async (): Promise<boolean> => {
		return probeBackend();
	}, []);

	const embedAbortRef = useRef<AbortController | null>(null);

	const startEmbeddings = useCallback(async (): Promise<void> => {
		const repo = repoRef.current;
		if (!repo) throw new Error("No repository loaded");

		setEmbeddingStatus("loading");
		setEmbeddingProgress(null);

		try {
			const { jobId } = await backendStartEmbeddings(repo);

			await new Promise<void>((resolve, reject) => {
				embedAbortRef.current = streamEmbeddingProgress(
					jobId,
					(jobProgress: JobProgress) => {
						setEmbeddingProgress({
							phase: jobProgress.phase,
							percent: jobProgress.percent,
						});
						if (
							jobProgress.phase === "loading-model" ||
							jobProgress.phase === "loading"
						) {
							setEmbeddingStatus("loading");
						} else if (jobProgress.phase === "embedding") {
							setEmbeddingStatus("embedding");
						} else if (jobProgress.phase === "indexing") {
							setEmbeddingStatus("indexing");
						}
					},
					() => {
						setEmbeddingStatus("ready");
						setEmbeddingProgress({ phase: "ready", percent: 100 });
						resolve();
					},
					(error: string) => {
						setEmbeddingStatus("error");
						reject(new Error(error));
					},
				);
			});
		} catch (error: unknown) {
			if (
				error instanceof Error &&
				error.message.includes("already in progress")
			) {
				setEmbeddingStatus("embedding");
				return;
			}
			setEmbeddingStatus("error");
			throw error;
		}
	}, []);

	const startEmbeddingsWithFallback = useCallback(() => {
		const isPlaywright =
			(typeof navigator !== "undefined" && navigator.webdriver) ||
			(typeof import.meta !== "undefined" &&
				typeof import.meta.env !== "undefined" &&
				import.meta.env.VITE_PLAYWRIGHT_TEST) ||
			(typeof process !== "undefined" && process.env.PLAYWRIGHT_TEST);
		if (isPlaywright) {
			setEmbeddingStatus("idle");
			return;
		}
		startEmbeddings().catch((err) => {
			console.warn("Embeddings auto-start failed:", err);
		});
	}, [startEmbeddings]);

	const semanticSearch = useCallback(
		async (query: string, k: number = 10): Promise<unknown[]> => {
			return backendSearch(query, {
				limit: k,
				mode: "semantic",
				repo: repoRef.current,
			});
		},
		[],
	);

	const semanticSearchWithContext = useCallback(
		async (
			query: string,
			k: number = 5,
			_hops: number = 2,
		): Promise<unknown[]> => {
			return backendSearch(query, {
				limit: k,
				mode: "semantic",
				enrich: true,
				repo: repoRef.current,
			});
		},
		[],
	);

	const switchRepo = useCallback(
		async (repoName: string) => {
			if (!serverBaseUrl) return;

			setProgress({
				phase: "extracting",
				percent: 0,
				message: "Switching repository...",
				detail: `Loading ${repoName}`,
			});
			setViewMode("loading");

			setHighlightedNodeIds(new Set());
			clearAIToolHighlights();
			clearAICitationHighlights();
			clearBlastRadius();
			setSelectedNode(null);
			setQueryResult(null);
			setCodeReferences([]);
			setCodePanelOpen(false);
			setCodeReferenceFocus(null);

			let pNameStr = repoName || "server-project";

			try {
				const result: ConnectResult = await connectToServer(
					serverBaseUrl,
					(phase, downloaded, total) => {
						if (phase === "validating") {
							setProgress({
								phase: "extracting",
								percent: 5,
								message: "Switching repository...",
								detail: "Validating",
							});
						} else if (phase === "downloading") {
							const pct = total ? Math.round((downloaded / total) * 90) + 5 : 50;
							const mb = (downloaded / (1024 * 1024)).toFixed(1);
							setProgress({
								phase: "extracting",
								percent: pct,
								message: "Downloading graph...",
								detail: `${mb} MB downloaded`,
							});
						} else if (phase === "extracting") {
							setProgress({
								phase: "extracting",
								percent: 97,
								message: "Processing...",
								detail: "Extracting file contents",
							});
						}
					},
					undefined,
					repoName,
					{ awaitAnalysis: true },
				);

				const repoPath = result.repoInfo.repoPath ?? result.repoInfo.path;
				const pName =
					repoName ||
					result.repoInfo.name ||
					(repoPath || "").replace(/\\/g, "/").split("/").filter(Boolean).pop() ||
					"server-project";
				setProjectName(pName);
				repoRef.current = pName;
				pNameStr = pName;

				const newGraph = createKnowledgeGraph();
				for (const node of result.nodes) newGraph.addNode(node);
				for (const rel of result.relationships) newGraph.addRelationship(rel);
				setGraph(newGraph);
			} catch (err: unknown) {
				console.error("Repo switch failed:", err);
				setProgress({
					phase: "error",
					percent: 0,
					message: "Failed to switch repository",
					detail: err instanceof Error ? err.message : "Unknown error",
				});
				setTimeout(() => {
					setViewMode("exploring");
					setProgress(null);
				}, ERROR_RESET_DELAY_MS);
				return;
			}

			if (pNameStr) {
				const urlObj = new URL(window.location.href);
				urlObj.searchParams.set("project", pNameStr);
				window.history.replaceState(null, "", urlObj.toString());
			}

			setViewMode("exploring");
			startEmbeddingsWithFallback();
			setProgress(null);
		},
		[
			serverBaseUrl,
			setGraph,
			startEmbeddingsWithFallback,
			setHighlightedNodeIds,
			clearAIToolHighlights,
			clearAICitationHighlights,
			clearBlastRadius,
			setSelectedNode,
		],
	);

	const removeCodeReference = useCallback(
		(id: string) => {
			setCodeReferences((prev) => {
				const ref = prev.find((r) => r.id === id);
				const newRefs = prev.filter((r) => r.id !== id);

				if (ref?.nodeId && ref.source === "ai") {
					const stillReferenced = newRefs.some(
						(r) => r.nodeId === ref.nodeId && r.source === "ai",
					);
					if (!stillReferenced) {
						setAICitationHighlightedNodeIds((prevIds) => {
							const next = new Set(prevIds);
							next.delete(ref.nodeId!);
							return next;
						});
					}
				}

				if (newRefs.length === 0 && !selectedNode) {
					setCodePanelOpen(false);
				}

				return newRefs;
			});
		},
		[selectedNode],
	);

	const clearCodeReferences = useCallback(() => {
		setCodeReferences([]);
		setCodePanelOpen(false);
		setCodeReferenceFocus(null);
	}, []);

	const value: AppState = {
		viewMode,
		setViewMode,
		graph,
		setGraph,
		selectedNode,
		setSelectedNode,
		openCodePanel,
		visibleLabels,
		toggleLabelVisibility,
		visibleEdgeTypes,
		toggleEdgeVisibility,
		depthFilter,
		setDepthFilter,
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
		queryResult,
		setQueryResult,
		clearQueryHighlights,
		animatedNodes,
		triggerNodeAnimation,
		clearAnimations,
		progress,
		setProgress,
		projectName,
		setProjectName,
		serverBaseUrl,
		setServerBaseUrl,
		availableRepos,
		setAvailableRepos,
		switchRepo,
		setCurrentRepo,
		runQuery,
		isDatabaseReady,
		embeddingStatus,
		embeddingProgress,
		startEmbeddings,
		startEmbeddingsWithFallback,
		semanticSearch,
		semanticSearchWithContext,
		isEmbeddingReady: embeddingStatus === "ready",
		codeReferences,
		isCodePanelOpen,
		setCodePanelOpen,
		addCodeReference,
		removeCodeReference,
		clearAICodeReferences,
		clearCodeReferences,
		codeReferenceFocus,
	};

	return (
		<AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
	);
};

export const useAppState = (): AppState => {
	const context = useContext(AppStateContext);
	if (!context) {
		throw new Error("useAppState must be used within AppStateProvider");
	}
	return context;
};

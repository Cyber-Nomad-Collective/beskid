import { AlertCircle, Brain, Check, Loader2, Zap } from "@/lib/lucide-icons";
import { useAppState } from "../hooks/useAppState";

/**
 * Embedding status indicator and trigger button
 * Shows in header when graph is loaded
 */
export const EmbeddingStatus = () => {
	const {
		embeddingStatus,
		embeddingProgress,
		startEmbeddings,
		graph,
		viewMode,
		serverBaseUrl,
	} = useAppState();

	if (viewMode !== "exploring" || !graph || serverBaseUrl) return null;

	const handleStartEmbeddings = async () => {
		try {
			await startEmbeddings();
		} catch (error) {
			console.error("Embedding failed:", error);
		}
	};

	if (embeddingStatus === "idle") {
		return (
			<div className="flex items-center gap-2">
				<button
					onClick={() => void handleStartEmbeddings()}
					className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted hover:text-foreground"
					title="Generate embeddings for semantic search"
				>
					<Brain className="h-4 w-4 text-primary transition-colors group-hover:text-primary" />
					<span className="hidden sm:inline">Enable Semantic Search</span>
					<Zap className="h-3 w-3 text-muted-foreground" />
				</button>
			</div>
		);
	}

	if (embeddingStatus === "loading") {
		const downloadPercent = embeddingProgress?.percent ?? 0;
		return (
			<div className="flex items-center gap-2.5 rounded-lg border border-primary/30 bg-card px-3 py-1.5 text-sm">
				<Loader2 className="h-4 w-4 animate-spin text-primary" />
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">Loading AI model...</span>
					<div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--beskid-secondary,var(--primary))] transition-all duration-300"
							style={{ width: `${downloadPercent}%` }}
						/>
					</div>
				</div>
			</div>
		);
	}

	if (embeddingStatus === "embedding") {
		const percent = embeddingProgress?.percent ?? 0;
		return (
			<div className="flex items-center gap-2.5 rounded-lg border border-node-function/30 bg-card px-3 py-1.5 text-sm">
				<Loader2 className="h-4 w-4 animate-spin text-node-function" />
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">Embedding nodes…</span>
					<div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-gradient-to-r from-node-function to-primary transition-all duration-300"
							style={{ width: `${percent}%` }}
						/>
					</div>
				</div>
			</div>
		);
	}

	if (embeddingStatus === "indexing") {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-card px-3 py-1.5 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin text-primary" />
				<span className="text-xs">Creating vector index...</span>
			</div>
		);
	}

	if (embeddingStatus === "ready") {
		return (
			<div
				className="flex items-center gap-2 rounded-lg border border-node-function/30 bg-node-function/10 px-3 py-1.5 text-sm text-node-function"
				title="Semantic search is ready"
			>
				<Check className="h-4 w-4" />
				<span className="text-xs font-medium">Semantic Ready</span>
			</div>
		);
	}

	if (embeddingStatus === "error") {
		return (
			<button
				onClick={() => void handleStartEmbeddings()}
				className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/20"
				title="Embedding failed. Click to retry."
			>
				<AlertCircle className="h-4 w-4" />
				<span className="text-xs">Failed - Retry</span>
			</button>
		);
	}

	return null;
};

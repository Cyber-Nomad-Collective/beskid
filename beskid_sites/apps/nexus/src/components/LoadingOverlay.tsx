import type { PipelineProgress } from "gitnexus-shared";

interface LoadingOverlayProps {
	progress: PipelineProgress;
}

export const LoadingOverlay = ({ progress }: LoadingOverlayProps) => {
	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute top-1/3 left-1/3 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl" />
				<div className="absolute right-1/3 bottom-1/3 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl" />
			</div>

			<div className="relative mb-10">
				<div className="h-28 w-28 animate-pulse-glow rounded-full bg-gradient-to-br from-primary to-[var(--beskid-secondary,var(--primary))]" />
				<div className="absolute inset-0 h-28 w-28 rounded-full bg-gradient-to-br from-primary to-[var(--beskid-secondary,var(--primary))] opacity-50 blur-xl" />
			</div>

			<div className="mb-4 w-80">
				<div className="h-1.5 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--beskid-secondary,var(--primary))] transition-all duration-300 ease-out"
						style={{ width: `${progress.percent}%` }}
					/>
				</div>
			</div>

			<div className="text-center">
				<p className="mb-1 font-mono text-sm text-muted-foreground">
					{progress.message}
					<span className="animate-pulse">|</span>
				</p>
				{progress.detail && (
					<p className="max-w-md truncate font-mono text-xs text-muted-foreground">
						{progress.detail}
					</p>
				)}
			</div>

			{progress.stats && (
				<div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-node-file" />
						<span>
							{progress.stats.filesProcessed} / {progress.stats.totalFiles} files
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-node-function" />
						<span>{progress.stats.nodesCreated} nodes</span>
					</div>
				</div>
			)}

			<p className="mt-4 font-mono text-3xl font-semibold text-foreground">
				{progress.percent}%
			</p>
		</div>
	);
};

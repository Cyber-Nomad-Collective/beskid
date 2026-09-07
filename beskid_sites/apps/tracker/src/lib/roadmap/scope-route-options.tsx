import {
	parseRoadmapScopeNotFound,
	scopeKindLabel,
} from "#/lib/roadmap/scope-not-found";

function ScopePending() {
	return (
		<div
			className="roadmap-scope-pending page-wrap flex min-h-[min(28rem,60vh)] flex-col items-center justify-center gap-5 py-16"
			aria-live="polite"
			aria-busy="true"
		>
			<div className="roadmap-scope-pending__spinner" aria-hidden="true" />
			<div className="text-center">
				<p className="island-kicker">Loading</p>
				<p className="text-muted-foreground mt-2 text-sm">
					Resolving roadmap scope from the catalog…
				</p>
			</div>
		</div>
	);
}

function scopeErrorDetailText(error: unknown): string {
	if (error instanceof Error) {
		return error.stack ?? error.message;
	}
	if (typeof error === "string") return error;
	try {
		return JSON.stringify(error, null, 2);
	} catch {
		return "Unknown error";
	}
}

function ScopeProcessFailure({
	error,
	reset,
}: {
	error: unknown;
	reset: () => void;
}) {
	const scopeError = parseRoadmapScopeNotFound(error);
	const details = scopeErrorDetailText(error);

	return (
		<div className="roadmap-process-failure page-wrap flex min-h-[min(28rem,60vh)] flex-col items-center justify-center py-16">
			<div className="roadmap-process-failure__panel island-shell w-full max-w-lg rounded-2xl p-8 text-center">
				<div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
					<span className="text-xl" aria-hidden="true">
						!
					</span>
				</div>
				<p className="island-kicker mt-6">Process failure</p>
				<h1 className="display-title text-foreground mt-2 text-xl font-bold">
					{scopeError
						? `${scopeKindLabel(scopeError.scope)} not found`
						: "Scope could not be resolved"}
				</h1>
				<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
					{scopeError ? (
						<>
							No <strong>{scopeError.scope}</strong> named{" "}
							<code className="text-foreground rounded bg-muted px-1.5 py-0.5 text-xs">
								{scopeError.slug}
							</code>{" "}
							exists for version{" "}
							<code className="text-foreground rounded bg-muted px-1.5 py-0.5 text-xs">
								{scopeError.versionId}
							</code>{" "}
							in the current catalog.
						</>
					) : (
						"We could not load this roadmap scope from the catalog. Try again or return to the timeline."
					)}
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium"
						onClick={() => reset()}
					>
						Try again
					</button>
					{scopeError ? (
						<a
							href={`/versions/${scopeError.versionId}`}
							className="border-input bg-background inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium"
						>
							Version overview
						</a>
					) : null}
					<a
						href="/"
						className="hover:bg-accent inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium"
					>
						Release timeline
					</a>
				</div>
				{!scopeError ? (
					<details className="mt-6 text-left" open={!import.meta.env.PROD}>
						<summary className="text-muted-foreground cursor-pointer text-xs">
							Technical details
						</summary>
						<pre className="bg-muted text-foreground mt-3 max-h-48 overflow-auto rounded-lg border border-border p-3 text-left text-xs leading-relaxed">
							{details}
						</pre>
					</details>
				) : null}
			</div>
		</div>
	);
}

/** Shared TanStack route chrome for catalog scope pages (load → failure, not bare 404). */
export const roadmapScopeRouteOptions = {
	pendingMs: 280,
	pendingComponent: ScopePending,
	errorComponent: ScopeProcessFailure,
} as const;

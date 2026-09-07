"use client";

import { type ErrorComponentProps, Link } from "@tanstack/react-router";
import { AlertTriangle, Bug, History, Home, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

function errorDetailText(error: unknown): string {
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

function friendlyErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim()) {
		const message = error.message.trim();
		if (message.length <= 160 && !message.includes("\n")) {
			return message;
		}
	}
	return "We could not load this roadmap view. Try again, or return to the timeline.";
}

type RoadmapRouteErrorProps = ErrorComponentProps & {
	layout?: "embedded" | "standalone";
};

export function RoadmapRouteError({
	error,
	reset,
	layout = "embedded",
}: RoadmapRouteErrorProps) {
	const [showDetails, setShowDetails] = useState(import.meta.env.DEV);
	const details = errorDetailText(error);

	return (
		<div
			className={cn(
				"roadmap-route-error flex min-h-[min(28rem,60vh)] flex-col items-center justify-center py-16",
				layout === "standalone" && "page-wrap min-h-[70vh]",
			)}
		>
			<div className="roadmap-route-error__panel island-shell w-full max-w-lg rounded-2xl p-8 text-center">
				<div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
					<AlertTriangle className="size-7" aria-hidden="true" />
				</div>
				<p className="island-kicker mt-6">Unexpected error</p>
				<h1 className="display-title text-foreground mt-2 text-xl font-bold">
					Something interrupted this page
				</h1>
				<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
					{friendlyErrorMessage(error)}
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button type="button" variant="default" size="sm" onClick={() => reset()}>
						<RotateCcw className="size-4" />
						Try again
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link to="/">
							<History className="size-4" />
							Roadmap
						</Link>
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<Link to="/bugs">
							<Bug className="size-4" />
							Bugs
						</Link>
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<Link to="/">
							<Home className="size-4" />
							Home
						</Link>
					</Button>
				</div>
				{import.meta.env.PROD ? (
					<div className="mt-6 text-left">
						<button
							type="button"
							className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
							onClick={() => setShowDetails((open) => !open)}
						>
							{showDetails ? "Hide technical details" : "Show technical details"}
						</button>
						{showDetails ? (
							<pre className="bg-muted text-foreground mt-3 max-h-48 overflow-auto rounded-lg border border-border p-3 text-left text-xs leading-relaxed">
								{details}
							</pre>
						) : null}
					</div>
				) : (
					<details className="mt-6 text-left" open>
						<summary className="text-muted-foreground cursor-pointer text-xs">
							Technical details
						</summary>
						<pre className="bg-muted text-foreground mt-3 max-h-48 overflow-auto rounded-lg border border-border p-3 text-left text-xs leading-relaxed">
							{details}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
}

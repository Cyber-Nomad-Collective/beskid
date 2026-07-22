"use client";

import { type ErrorComponentProps, Link } from "@tanstack/react-router";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { Button } from "#/components/ui-primitives";

function classes(...values: Array<string | false | undefined>): string {
	return values.filter(Boolean).join(" ");
}

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
	return "We could not load this platform-spec view. Try again, or return to the catalog.";
}

type SpecRouteErrorProps = ErrorComponentProps & {
	layout?: "embedded" | "standalone";
};

export function SpecRouteError({
	error,
	reset,
	layout = "embedded",
}: SpecRouteErrorProps) {
	const [showDetails, setShowDetails] = useState(import.meta.env.DEV);
	const details = errorDetailText(error);

	return (
		<div
			className={classes(
				"spec-route-error flex min-h-[min(28rem,60vh)] flex-col items-center justify-center px-6 py-16",
				layout === "standalone" && "min-h-[70vh]",
			)}
		>
			<div className="spec-route-error__panel island-shell w-full max-w-lg rounded-2xl p-8 text-center">
				<div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
					<AlertTriangle className="size-7" aria-hidden="true" />
				</div>
				<p className="mt-6 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
					Unexpected error
				</p>
				<h1 className="display-title text-foreground mt-2 text-xl font-bold">
					Something interrupted this page
				</h1>
				<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
					{friendlyErrorMessage(error)}
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button type="button" onClick={() => reset()}>
						<span className="inline-flex items-center gap-2">
							<RotateCcw className="size-4" aria-hidden="true" />
							Try again
						</span>
					</Button>
					<Link
						to="/platform-spec"
						className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
					>
						<Home className="size-4" aria-hidden="true" />
						Platform spec
					</Link>
				</div>
				{import.meta.env.PROD ? (
					<div className="mt-6 text-left">
						<button
							type="button"
							className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
							onClick={() => setShowDetails((open) => !open)}
						>
							{showDetails
								? "Hide technical details"
								: "Show technical details"}
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

export function RootSpecRouteError(
	props: ComponentProps<typeof SpecRouteError>,
) {
	return <SpecRouteError {...props} layout="standalone" />;
}

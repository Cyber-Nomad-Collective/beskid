import { Link, useRouterState } from "@tanstack/react-router";
import { Bug, History, Home, MapPinOff } from "lucide-react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

type RoadmapNotFoundProps = {
	/** Standalone pages render outside the app shell (root-level 404). */
	layout?: "embedded" | "standalone";
};

export function RoadmapNotFound({ layout = "embedded" }: RoadmapNotFoundProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const panel = (
		<div className="roadmap-not-found__panel island-shell w-full max-w-lg rounded-2xl p-8 text-center">
			<div className="bg-muted text-foreground mx-auto flex size-14 items-center justify-center rounded-full">
				<MapPinOff className="size-7" aria-hidden="true" />
			</div>
			<p className="island-kicker mt-6">Not found</p>
			<h1 className="display-title mt-2 text-xl font-bold">
				This page does not exist
			</h1>
			<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
				The roadmap has no view at{" "}
				<code className="text-foreground rounded bg-muted px-1.5 py-0.5 text-xs">
					{pathname}
				</code>
				. Pick a destination below or use search in the header.
			</p>
			<nav
				className="mt-8 flex flex-wrap items-center justify-center gap-3"
				aria-label="Roadmap destinations"
			>
				<Button variant="default" size="sm" asChild>
					<Link to="/">
						<History className="size-4" />
						Roadmap
					</Link>
				</Button>
				<Button variant="outline" size="sm" asChild>
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
			</nav>
		</div>
	);

	return (
		<div
			className={cn(
				"roadmap-not-found flex min-h-[min(28rem,60vh)] flex-col items-center justify-center py-16",
				layout === "standalone" && "page-wrap min-h-[70vh]",
			)}
		>
			{panel}
		</div>
	);
}

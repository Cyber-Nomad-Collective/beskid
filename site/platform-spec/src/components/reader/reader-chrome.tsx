import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { ReaderTopBarActions } from "#/components/reader/reader-topbar-actions";
import { SpecViewModeProvider } from "#/components/reader/spec-view-mode";
import { BeskidHub } from "#/components/ui-primitives";

export function ReaderChrome({ children }: { children: ReactNode }) {
	return (
		<SpecViewModeProvider>
			<div className="reader-layout flex min-h-screen flex-col">
				<header className="spec-topbar sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur">
					<BeskidHub />
					<Link
						to="/platform-spec/$"
						params={{ _splat: "" }}
						className="text-sm font-semibold tracking-tight hover:underline"
					>
						Platform specification
					</Link>
					<ReaderTopBarActions />
				</header>
				<div className="min-h-0 flex-1">{children}</div>
			</div>
		</SpecViewModeProvider>
	);
}

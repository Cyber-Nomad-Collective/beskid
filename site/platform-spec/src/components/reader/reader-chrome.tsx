import type { ReactNode } from "react";

import { BeskidHub } from "@beskid/beskid-ui";
import { Link } from "@tanstack/react-router";

export function ReaderChrome({ children }: { children: ReactNode }) {
	return (
		<div className="reader-layout flex min-h-screen flex-col">
			<header className="spec-topbar sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur">
				<BeskidHub />
				<Link
					to="/platform-spec/"
					className="text-sm font-semibold tracking-tight hover:underline"
				>
					Platform specification
				</Link>
			</header>
			<div className="min-h-0 flex-1">{children}</div>
		</div>
	);
}

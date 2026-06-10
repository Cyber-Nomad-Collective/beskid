import type { ReactNode } from "react";

import type { NavTreeNode } from "@cyber-nomad-collective/trudoc/platform-spec/nav-tree";

import { SpecNavRail } from "#/components/reader/spec-nav-rail";

interface SpecShellProps {
	navTree: NavTreeNode;
	activeSlug?: string;
	children: ReactNode;
}

export function SpecShell({ navTree, activeSlug, children }: SpecShellProps) {
	return (
		<div className="spec-shell flex min-h-0 flex-1">
			<aside className="hidden w-72 shrink-0 lg:block">
				<SpecNavRail tree={navTree} activeSlug={activeSlug} />
			</aside>
			<main className="min-w-0 flex-1">{children}</main>
		</div>
	);
}

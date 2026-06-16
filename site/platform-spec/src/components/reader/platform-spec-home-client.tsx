"use client";

import { SpecNavRail } from "@beskid/ui-react/platform-spec";

import { useSpecViewMode } from "#/components/reader/spec-view-mode";
import type { NavTreeNode } from "#/server/catalog";
import { Badge } from "@beskid/ui-react";

export interface PlatformSpecHomeClientProps {
	catalog: Array<{
		slug: string;
		href: string;
		title: string;
		description: string | null;
		status: string | null;
		pathClass: string;
	}>;
	navTree: NavTreeNode;
}

function toUiNavTree(node: NavTreeNode) {
	return {
		slug: node.slug,
		href: node.href,
		title: node.title,
		children: node.children?.map(toUiNavTree),
	};
}

export function PlatformSpecHomeClient({
	catalog,
	navTree,
}: PlatformSpecHomeClientProps) {
	const { mode } = useSpecViewMode();
	const domains = catalog.filter((entry) => entry.pathClass === "domain");
	const stats = {
		domains: domains.length,
		total: catalog.length,
		features: catalog.filter((entry) => entry.pathClass === "feature").length,
	};

	return (
		<div className="platform-spec-home mx-auto w-full max-w-6xl space-y-8 px-6 py-6">
			<section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card px-8 py-10">
				<div className="relative z-10 max-w-2xl space-y-4">
					<Badge variant="secondary">Normative specification</Badge>
					<h1 className="display-title text-4xl font-bold tracking-tight">
						Platform specification
					</h1>
					<p className="text-lg text-muted-foreground">
						Structured Beskid platform contract — browse domains, areas, and
						features. Edit via the editorial app or local spec CLI.
					</p>
					<div className="flex flex-wrap gap-4 pt-2 text-sm">
						<span>
							<strong>{stats.domains}</strong> domains
						</span>
						<span>
							<strong>{stats.features}</strong> features
						</span>
						<span>
							<strong>{stats.total}</strong> documents
						</span>
					</div>
				</div>
			</section>

			{mode === "browse" ? (
				<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
					<SpecNavRail
						navTree={[toUiNavTree(navTree)]}
						activeSlug="platform-spec"
						className="hidden lg:block"
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						{domains.map((domain) => (
							<a
								key={domain.slug}
								href={domain.href}
								className="island-shell rounded-xl p-5 transition-colors hover:border-primary/40"
							>
								<h2 className="text-lg font-semibold">{domain.title}</h2>
								{domain.description ? (
									<p className="mt-2 text-sm text-muted-foreground">
										{domain.description}
									</p>
								) : null}
							</a>
						))}
					</div>
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground">
					Architecture map renders from graph data (connect Memgraph export).
				</div>
			)}
		</div>
	);
}

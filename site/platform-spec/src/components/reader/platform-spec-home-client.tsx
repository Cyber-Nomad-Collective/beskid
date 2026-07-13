"use client";

import { useSpecViewMode } from "#/components/reader/spec-view-mode";
import { Badge } from "#/components/ui-primitives";

export interface PlatformSpecHomeClientProps {
	catalog: Array<{
		slug: string;
		href: string;
		title: string;
		description: string | null;
		status: string | null;
		pathClass: string;
		domain: string | null;
	}>;
}

export function PlatformSpecHomeClient({
	catalog,
}: PlatformSpecHomeClientProps) {
	const { mode } = useSpecViewMode();
	const byDomain = new Map<
		string,
		{ domain: string; entry: (typeof catalog)[number]; count: number }
	>();
	for (const entry of catalog) {
		if (!entry.domain) continue;
		const current = byDomain.get(entry.domain);
		byDomain.set(entry.domain, {
			domain: entry.domain,
			entry: current?.entry ?? entry,
			count: (current?.count ?? 0) + 1,
		});
	}
	const domains = [...byDomain.values()];
	const stats = {
		domains: domains.length,
		total: catalog.length,
		features: catalog.length,
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
						capabilities. Edit through reviewed OpenSpec changes.
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
				<div className="grid gap-4 sm:grid-cols-2">
					{domains.map(({ domain, entry, count }) => (
						<a
							key={domain}
							href={entry.href}
							className="island-shell rounded-xl p-5 transition-colors hover:border-primary/40"
						>
							<h2 className="text-lg font-semibold capitalize">
								{domain.replace(/-/g, " ")}
							</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								{count} canonical OpenSpec capabilities
							</p>
						</a>
					))}
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground">
					Architecture map renders from graph data (connect Memgraph export).
				</div>
			)}
		</div>
	);
}

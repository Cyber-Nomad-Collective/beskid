"use client";

import { FactsDagView, type FactsDagModel } from "@beskid/ui-react/graph";

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

function catalogToFactsDag(
	catalog: PlatformSpecHomeClientProps["catalog"],
): FactsDagModel {
	const domains = new Map<string, { domain: string; count: number; href: string }>();
	for (const entry of catalog) {
		if (!entry.domain) continue;
		const current = domains.get(entry.domain);
		domains.set(entry.domain, {
			domain: entry.domain,
			count: (current?.count ?? 0) + 1,
			href: current?.href ?? entry.href,
		});
	}

	const rootId = "platform-spec-root";
	const nodes: FactsDagModel["nodes"] = [
		{
			id: rootId,
			kind: "Root",
			label: "Platform specification",
			location: { path: "openspec/specs", line: 1 },
		},
	];
	const edges: FactsDagModel["edges"] = [];

	for (const { domain, count } of domains.values()) {
		const id = `domain:${domain}`;
		nodes.push({
			id,
			kind: "Domain",
			label: `${domain.replace(/-/g, " ")} (${count})`,
			location: { path: `openspec/specs`, line: 1 },
		});
		edges.push({ from: rootId, to: id, label: "domain" });
	}

	if (nodes.length === 1) {
		return {
			nodes: [
				...nodes,
				{
					id: "domain:compiler",
					kind: "Domain",
					label: "compiler",
					location: { path: "openspec/specs", line: 1 },
				},
				{
					id: "domain:language",
					kind: "Domain",
					label: "language",
					location: { path: "openspec/specs", line: 1 },
				},
			],
			edges: [
				{ from: rootId, to: "domain:compiler", label: "domain" },
				{ from: rootId, to: "domain:language", label: "domain" },
			],
		};
	}

	return { nodes, edges };
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
	const mapModel = catalogToFactsDag(catalog);

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
				<section className="space-y-3">
					<div>
						<h2 className="text-lg font-semibold">Architecture map</h2>
						<p className="text-sm text-muted-foreground">
							Domain graph derived from the catalog. Click a node to open the
							matching source path when an editor URL is available.
						</p>
					</div>
					<FactsDagView
						model={mapModel}
						className="h-[420px]"
						openInEditor={{
							githubRepo: "Cyber-Nomad-Collective/beskid",
							githubRef: "main",
						}}
					/>
				</section>
			)}
		</div>
	);
}

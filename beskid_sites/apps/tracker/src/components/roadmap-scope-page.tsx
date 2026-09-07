import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MarkdownContent } from "#/components/markdown-content";
import { RoadmapScopeTaskList } from "#/components/roadmap-scope-task-list";
import { RoadmapStatWidgets } from "#/components/roadmap-stat-widgets";
import { ShellVersionsSync } from "#/components/shell-versions-sync";
import { Badge } from "#/components/ui/badge";
import type { RoadmapScopeKind } from "#/lib/roadmap/scope-not-found";
import { scopeKindLabel } from "#/lib/roadmap/scope-not-found";
import type { RoadmapCatalogVersion } from "#/lib/roadmap/types";
import type { SeedTask } from "#/lib/seed/schemas";

interface RoadmapScopePageProps {
	version: RoadmapCatalogVersion;
	scope: RoadmapScopeKind;
	slug: string;
	title: string;
	subtitle?: string;
	tasks: SeedTask[];
	extra?: ReactNode;
}

export function RoadmapScopePage({
	version,
	scope,
	slug,
	title,
	subtitle,
	tasks,
	extra,
}: RoadmapScopePageProps) {
	return (
		<main className="page-wrap dashboard-layout flex min-h-0 flex-1 flex-col gap-8 py-8">
			<ShellVersionsSync version={version.id} />

			<header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
				<div>
					<p className="island-kicker">{scopeKindLabel(scope)}</p>
					<h1 className="display-title mt-1 text-2xl font-bold">{title}</h1>
					<MarkdownContent optional size="md" className="mt-2 max-w-2xl">
						{subtitle ?? ""}
					</MarkdownContent>
					<p className="text-muted-foreground mt-2 font-mono text-xs">
						{version.id} · <span className="text-foreground">{slug}</span>
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">{tasks.length} tasks</Badge>
					{scope === "workstream" ? (
						<Link
							to="/v/$version/w/$workstream"
							params={{ version: version.id, workstream: slug }}
							className="text-sm font-medium hover:underline"
						>
							Open board →
						</Link>
					) : null}
					<Link
						to="/versions/$version"
						params={{ version: version.id }}
						className="text-sm font-medium hover:underline"
					>
						← Overview
					</Link>
				</div>
			</header>

			<RoadmapStatWidgets stats={version.stats} compact />

			{extra}

			<section>
				<h2 className="dashboard-section__title mb-4 text-sm font-semibold tracking-wide uppercase">
					Tasks in scope
				</h2>
				<RoadmapScopeTaskList versionId={version.id} tasks={tasks} />
			</section>
		</main>
	);
}

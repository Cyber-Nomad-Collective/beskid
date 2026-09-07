import { createFileRoute, Link } from "@tanstack/react-router";

import { MarkdownContent } from "#/components/markdown-content";
import { RoadmapScopeTaskList } from "#/components/roadmap-scope-task-list";
import { RoadmapStatWidgets } from "#/components/roadmap-stat-widgets";
import { ShellVersionsSync } from "#/components/shell-versions-sync";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import {
	versionStatusBadgeVariant,
	versionStatusLabel,
} from "#/lib/roadmap/version-status";
import { getVersionDashboard } from "#/server/catalog";

export const Route = createFileRoute("/_shell/versions/$version/")({
	...roadmapScopeRouteOptions,
	loader: ({ params }) =>
		getVersionDashboard({ data: { version: params.version } }),
	component: VersionOverviewPage,
});

function VersionOverviewPage() {
	const { version: versionId } = Route.useParams();
	const { version, recentTasks } = Route.useLoaderData();

	return (
		<div className="min-h-0 flex-1">
			<ShellVersionsSync version={versionId} />
			<main className="page-wrap dashboard-layout py-8">
				<header className="island-shell mb-8 rounded-2xl p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="island-kicker">Delivery version</p>
							<h1 className="display-title mt-1 text-2xl font-bold md:text-3xl">
								{version.id}: {version.title}
							</h1>
							<MarkdownContent optional size="md" className="mt-3 max-w-2xl">
								{version.summary}
							</MarkdownContent>
						</div>
						<Badge variant={versionStatusBadgeVariant(version.status)}>
							{versionStatusLabel(version.status)}
						</Badge>
					</div>
				</header>

				<RoadmapStatWidgets stats={version.stats} />

				<div className="mt-10 grid gap-8 lg:grid-cols-2">
					<section>
						<h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
							Deliverables
						</h2>
						<ul className="grid gap-3">
							{version.deliverables.map((deliverable) => (
								<li key={deliverable.id}>
									<Card className="dashboard-widget kanban-card">
										<CardHeader className="pb-2">
											<CardTitle className="text-base">
												<Link
													to="/versions/$version/deliverables/$deliverableId"
													params={{
														version: version.id,
														deliverableId: deliverable.id,
													}}
													className="hover:underline"
												>
													{deliverable.title}
												</Link>
											</CardTitle>
										</CardHeader>
										<CardContent className="flex flex-col gap-2 pt-0 text-xs">
											{deliverable.description ? (
												<MarkdownContent
													optional
													className="text-xs [&_p]:text-xs [&_li]:text-xs"
												>
													{deliverable.description}
												</MarkdownContent>
											) : null}
											<p className="text-muted-foreground">
												{deliverable.stats.tasksDone} / {deliverable.stats.tasksTotal} tasks
												done
											</p>
										</CardContent>
									</Card>
								</li>
							))}
						</ul>
					</section>

					<section>
						<h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
							Workstreams
						</h2>
						<ul className="grid gap-3">
							{version.workstreams.map((ws) => (
								<li key={ws.slug}>
									<Card className="dashboard-widget kanban-card">
										<CardHeader className="pb-2">
											<CardTitle className="text-base">
												<Link
													to="/v/$version/w/$workstream"
													params={{
														version: version.id,
														workstream: ws.slug,
													}}
													className="hover:underline"
												>
													{ws.title}
												</Link>
											</CardTitle>
										</CardHeader>
										<CardContent className="text-muted-foreground flex flex-col gap-2 pt-0 text-xs">
											<MarkdownContent
												optional
												className="text-xs [&_p]:text-xs [&_li]:text-xs"
											>
												{ws.summary}
											</MarkdownContent>
											<Link
												to="/versions/$version/workstreams/$slug"
												params={{ version: version.id, slug: ws.slug }}
												className="text-primary text-xs hover:underline"
											>
												Overview
											</Link>
										</CardContent>
									</Card>
								</li>
							))}
						</ul>
					</section>
				</div>

				<section className="dashboard-section mt-10">
					<h2 className="dashboard-section__title mb-4 text-sm font-semibold tracking-wide uppercase">
						Recent tasks
					</h2>
					<RoadmapScopeTaskList
						versionId={version.id}
						tasks={recentTasks}
						emptyLabel="No tasks in the catalog for this version yet."
					/>
				</section>
			</main>
		</div>
	);
}

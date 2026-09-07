import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { ShellVersionsSync } from "#/components/shell-versions-sync";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { VersionSwitcher } from "#/components/version-switcher";
import { getAuthUser } from "#/server/auth";
import { getWorkstreamDashboard } from "#/server/roadmap";

export const Route = createFileRoute("/_shell/workstreams/v/$version")({
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}
		return { user };
	},
	loader: ({ params }) =>
		getWorkstreamDashboard({ data: { version: params.version } }),
	component: WorkstreamsPage,
});

function WorkstreamsPage() {
	const { version } = Route.useParams();
	const data = Route.useLoaderData();

	return (
		<div className="min-h-0 flex-1">
			<ShellVersionsSync version={version} />
			<main className="page-wrap py-8">
				<div className="island-shell mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
					<div className="flex flex-wrap items-center gap-3">
						<VersionSwitcher
							versions={data.versions}
							current={version}
							to="/workstreams/v/$version"
						/>
						<div>
							<p className="island-kicker">Workstreams</p>
							<p className="text-muted-foreground text-sm">
								Grouped delivery for{" "}
								<code className="text-xs">roadmap/version/{version}</code>
							</p>
						</div>
					</div>
					<Link
						to="/v/$version"
						params={{ version }}
						className="text-sm font-medium hover:underline"
					>
						Back to board
					</Link>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data.workstreams.map((ws) => (
						<Card key={ws.slug} className="kanban-card">
							<CardHeader>
								<CardTitle className="text-base">
									{ws.slug === "_unassigned" ? "Unassigned" : ws.slug}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-2">
								<Badge variant="secondary">{ws.issueCount} tasks</Badge>
								<Badge variant="outline">{ws.inProgressCount} in progress</Badge>
								<Badge>{ws.doneCount} done</Badge>
								{ws.slug === "_unassigned" ? (
									<Link
										to="/v/$version"
										params={{ version }}
										className="text-primary mt-2 text-sm hover:underline"
									>
										Open on global board →
									</Link>
								) : (
									<Link
										to="/v/$version/w/$workstream"
										params={{ version, workstream: ws.slug }}
										className="text-primary mt-2 text-sm hover:underline"
									>
										Open board →
									</Link>
								)}
							</CardContent>
						</Card>
					))}
				</div>
				{data.workstreams.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No tasks for this version yet. Create one from the kanban board.
					</p>
				) : null}
			</main>
		</div>
	);
}

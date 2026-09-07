import { createFileRoute } from "@tanstack/react-router";

import { RoadmapScopePage } from "#/components/roadmap-scope-page";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import { getWorkstreamDashboard } from "#/server/catalog";

export const Route = createFileRoute(
	"/_shell/versions/$version/workstreams/$slug",
)({
	...roadmapScopeRouteOptions,
	loader: ({ params }) =>
		getWorkstreamDashboard({
			data: { version: params.version, slug: params.slug },
		}),
	component: WorkstreamScopePage,
});

function WorkstreamScopePage() {
	const { workstream, tasks, version } = Route.useLoaderData();

	return (
		<RoadmapScopePage
			version={version}
			scope="workstream"
			slug={workstream.slug}
			title={workstream.title}
			subtitle={workstream.summary}
			tasks={tasks}
		/>
	);
}

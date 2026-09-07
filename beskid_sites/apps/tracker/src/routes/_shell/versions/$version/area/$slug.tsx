import { createFileRoute } from "@tanstack/react-router";

import { RoadmapScopePage } from "#/components/roadmap-scope-page";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import { getAreaDashboard } from "#/server/catalog";

export const Route = createFileRoute("/_shell/versions/$version/area/$slug")({
	...roadmapScopeRouteOptions,
	loader: ({ params }) =>
		getAreaDashboard({
			data: { version: params.version, slug: params.slug },
		}),
	component: AreaScopePage,
});

function AreaScopePage() {
	const { slug, tasks, version } = Route.useLoaderData();

	return (
		<RoadmapScopePage
			version={version}
			scope="area"
			slug={slug}
			title={slug}
			subtitle="Platform-spec area scope from roadmap labels and spec relations."
			tasks={tasks}
		/>
	);
}

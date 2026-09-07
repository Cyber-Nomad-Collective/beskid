import { createFileRoute } from "@tanstack/react-router";

import { RoadmapScopePage } from "#/components/roadmap-scope-page";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import { getDomainDashboard } from "#/server/catalog";

export const Route = createFileRoute("/_shell/versions/$version/domain/$slug")({
	...roadmapScopeRouteOptions,
	loader: ({ params }) =>
		getDomainDashboard({
			data: { version: params.version, slug: params.slug },
		}),
	component: DomainScopePage,
});

function DomainScopePage() {
	const { slug, tasks, version } = Route.useLoaderData();

	return (
		<RoadmapScopePage
			version={version}
			scope="domain"
			slug={slug}
			title={slug}
			subtitle="Platform-spec domain scope from roadmap labels and spec relations."
			tasks={tasks}
		/>
	);
}

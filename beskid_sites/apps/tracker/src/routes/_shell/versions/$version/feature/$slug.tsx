import { createFileRoute } from "@tanstack/react-router";

import { RoadmapScopePage } from "#/components/roadmap-scope-page";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import { getFeatureDashboard } from "#/server/catalog";

export const Route = createFileRoute("/_shell/versions/$version/feature/$slug")(
	{
		...roadmapScopeRouteOptions,
		loader: ({ params }) =>
			getFeatureDashboard({
				data: { version: params.version, slug: params.slug },
			}),
		component: FeatureScopePage,
	},
);

function FeatureScopePage() {
	const { slug, tasks, version } = Route.useLoaderData();

	return (
		<RoadmapScopePage
			version={version}
			scope="feature"
			slug={slug}
			title={slug}
			subtitle="Platform-spec feature scope from roadmap labels and spec relations."
			tasks={tasks}
		/>
	);
}

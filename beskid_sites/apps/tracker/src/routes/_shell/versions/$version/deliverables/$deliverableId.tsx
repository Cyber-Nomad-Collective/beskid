import { createFileRoute } from "@tanstack/react-router";

import { RoadmapScopePage } from "#/components/roadmap-scope-page";
import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";
import { getDeliverableDashboard } from "#/server/catalog";

export const Route = createFileRoute(
	"/_shell/versions/$version/deliverables/$deliverableId",
)({
	...roadmapScopeRouteOptions,
	loader: ({ params }) =>
		getDeliverableDashboard({
			data: {
				version: params.version,
				deliverableId: params.deliverableId,
			},
		}),
	component: DeliverableScopePage,
});

function DeliverableScopePage() {
	const { deliverable, tasks, version } = Route.useLoaderData();

	return (
		<RoadmapScopePage
			version={version}
			scope="deliverable"
			slug={deliverable.id}
			title={deliverable.title}
			subtitle={deliverable.description}
			tasks={tasks}
		/>
	);
}

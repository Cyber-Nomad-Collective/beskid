import { createFileRoute } from "@tanstack/react-router";

import { RoadmapTimelineHome } from "#/components/roadmap-timeline-home";
import { getAuthUser } from "#/server/auth";
import { getRoadmapCatalog } from "#/server/catalog";
import { getPublicBugStatsFn } from "#/server/public-bugs";

export const Route = createFileRoute("/_shell/")({
	loader: async () => {
		const [bugStats, user, catalog] = await Promise.all([
			getPublicBugStatsFn(),
			getAuthUser(),
			getRoadmapCatalog(),
		]);
		return { user, catalog, bugStats };
	},
	component: TimelineHomePage,
});

function TimelineHomePage() {
	const { user: loaderUser, catalog, bugStats } = Route.useLoaderData();
	const { authUser } = Route.useRouteContext();
	const user = loaderUser ?? authUser;

	return (
		<RoadmapTimelineHome catalog={catalog} bugStats={bugStats} user={user} />
	);
}

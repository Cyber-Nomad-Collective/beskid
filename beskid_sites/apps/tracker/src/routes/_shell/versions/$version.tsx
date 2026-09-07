import { createFileRoute, Outlet } from "@tanstack/react-router";

import { roadmapScopeRouteOptions } from "#/lib/roadmap/scope-route-options";

export const Route = createFileRoute("/_shell/versions/$version")({
	...roadmapScopeRouteOptions,
	component: VersionScopeLayout,
});

function VersionScopeLayout() {
	return <Outlet />;
}

import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import { getContext } from "@cyber-nomad-collective/beskid-shell-core";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { RoadmapNotFound } from "#/components/roadmap-not-found";
import { RoadmapRouteError } from "#/components/roadmap-route-error";
import { routeTree } from "#/routeTree.gen";

export interface TrackerRouterContext {
	queryClient: ReturnType<typeof getContext>["queryClient"];
	/** Authelia-derived user (null on unauthenticated/public routes). */
	user: ShellUser | null;
}

export function getRouter() {
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context: { ...context, user: null },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultNotFoundComponent: () => <RoadmapNotFound layout="standalone" />,
		defaultErrorComponent: RoadmapRouteError,
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: context.queryClient,
	});

	return router;
}

declare module "@tanstack/react-start" {
	interface Register {
		ssr: true;
		router: ReturnType<typeof getRouter>;
	}
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}

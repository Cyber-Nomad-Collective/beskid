import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import { getContext } from "@cyber-nomad-collective/beskid-shell-core";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { SpecRouteError } from "#/components/spec-route-error";
import { routeTree } from "./routeTree.gen";

/**
 * Router context for the platform-spec app.
 *
 * `user` is the Authelia-derived {@link ShellUser} (null on unauthenticated /
 * public reader routes), resolved in the root route's `beforeLoad` via
 * `getShellUser`. `queryClient` is shared with the shell-template pattern.
 */
export interface SpecRouterContext {
	queryClient: ReturnType<typeof getContext>["queryClient"];
	user: ShellUser | null;
}

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		context: { ...getContext(), user: null },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultErrorComponent: SpecRouteError,
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

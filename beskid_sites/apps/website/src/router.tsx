import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import { getContext } from "@cyber-nomad-collective/beskid-shell-core";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "#/routeTree.gen";

/**
 * Router context for the website app.
 *
 * `user` is the Authelia-derived {@link ShellUser} (null for the common
 * anonymous visitor), resolved in the root route's `beforeLoad` via
 * `getShellUser`. `queryClient` is shared with the shell-template pattern.
 */
export interface WebsiteRouterContext {
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

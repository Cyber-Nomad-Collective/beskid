import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core";
import { getContext } from "@cyber-nomad-collective/beskid-shell-core";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "#/routeTree.gen";

export interface ShellRouterContext {
	queryClient: ReturnType<typeof getContext>["queryClient"];
	/** Authelia-derived user (null on unauthenticated/public routes). */
	user: ShellUser | null;
}

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		context: { ...getContext(), user: null },
		scrollRestoration: true,
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

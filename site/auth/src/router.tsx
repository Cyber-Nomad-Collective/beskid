import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { getContext } from "#/integrations/tanstack-query/root-provider";
import { routeTree } from "#/routeTree.gen";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		context: getContext(),
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

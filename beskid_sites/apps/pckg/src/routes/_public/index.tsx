import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Index — redirect to the registry landing (`/packages`). The mode switcher
 * in the topbar animates between Docs and Registry; the index avoids a
 * duplicate landing surface.
 */
export const Route = createFileRoute("/_public/")({
	beforeLoad: () => {
		throw redirect({ to: "/packages", search: { q: "" } });
	},
});

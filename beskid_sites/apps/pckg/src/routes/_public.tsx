import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PckgShell } from "#/components/pckg-shell";

/**
 * Pathless layout for consumer-facing routes (packages, publishers, docs).
 * Sidebar is disabled — the layout collapses to topbar-only with the avatar
 * dropdown (per the shell API).
 */
export const Route = createFileRoute("/_public")({
	component: PublicLayout,
});

function PublicLayout() {
	const user = Route.useRouteContext({ select: (c) => c.user });
	return (
		<PckgShell sidebarEnabled={false} user={user}>
			<Outlet />
		</PckgShell>
	);
}

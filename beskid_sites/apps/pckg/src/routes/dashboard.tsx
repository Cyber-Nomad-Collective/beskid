import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PckgShell } from "#/components/pckg-shell";

/**
 * Dashboard layout — the ONLY pckg surface with the sidebar enabled.
 *
 * Guarded via the Authelia-derived `context.user` resolved by `__root`'s
 * `beforeLoad` (which calls the `getShellUser` server fn). Unauthenticated
 * users are redirected to the OIDC login flow; no server-only module is
 * imported here (the import-protection plugin would otherwise deny it on
 * the client). Authenticated users get the sidebar shell with the avatar
 * menu in the sidebar footer.
 */
export const Route = createFileRoute("/dashboard")({
	beforeLoad: ({ context }) => {
		if (!context.user) {
			throw redirect({ href: "/api/auth/login" });
		}
		return { user: context.user };
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	const user = Route.useRouteContext({ select: (c) => c.user });
	return (
		<PckgShell sidebarEnabled user={user}>
			<Outlet />
		</PckgShell>
	);
}

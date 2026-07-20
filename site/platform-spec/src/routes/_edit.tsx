import {
	Link,
	Outlet,
	createFileRoute,
	redirect,
} from "@tanstack/react-router";

import { ThemeToggle } from "#/components/theme-toggle";
import { getAuthUser } from "#/server/auth";
import { getAuthHubPairingStatusFn } from "#/server/auth-hub-pairing";

export const Route = createFileRoute("/_edit")({
	beforeLoad: async ({ location }) => {
		const { paired } = await getAuthHubPairingStatusFn();
		if (!paired) {
			throw redirect({ to: "/settings/auth/pair" });
		}

		const user = await getAuthUser();
		if (!user) {
			throw redirect({
				to: "/settings/auth/login",
				search: { next: location.pathname },
			});
		}

		return { user };
	},
	component: EditShell,
});

function EditShell() {
	const { user } = Route.useRouteContext();

	return (
		<div className="min-h-screen">
			<header className="flex items-center justify-between border-b px-6 py-3">
				<nav className="flex items-center gap-4 text-sm">
					<Link to="/edit" className="font-semibold">
						Platform Spec Editor
					</Link>
					<Link to="/edit" className="text-muted-foreground hover:underline">
						My drafts
					</Link>
					<Link
						to="/moderation"
						className="text-muted-foreground hover:underline"
					>
						Moderation
					</Link>
				</nav>
				<div className="flex items-center gap-3 text-sm">
					<span className="text-muted-foreground">@{user.login}</span>
					<ThemeToggle />
					<a href="/api/auth/logout" className="underline">
						Sign out
					</a>
				</div>
			</header>
			<main className="p-6">
				<Outlet />
			</main>
		</div>
	);
}

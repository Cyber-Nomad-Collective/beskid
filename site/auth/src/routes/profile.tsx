import { Button, ProfileCard } from "@beskid/ui-react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ThemeToggle } from "#/components/theme-toggle";
import { fetchProfileData } from "#/server/app-server.functions";

const profileSearchSchema = z.object({
	github_login: z.string().optional(),
});

export const Route = createFileRoute("/profile")({
	validateSearch: profileSearchSchema,
	loader: async () => {
		const data = await fetchProfileData();
		if (!data) throw redirect({ to: "/login" });
		return data;
	},
	component: ProfilePage,
});

function ProfilePage() {
	const { session, apps, isAdmin } = Route.useLoaderData();
	const { github_login: linkedLogin } = Route.useSearch();

	return (
		<div className="page-wrap py-10">
			<div className="auth-topbar">
				<Link to="/" className="island-kicker hover:underline">
					Beskid Auth
				</Link>
				<div className="flex items-center gap-2">
					{isAdmin ? (
						<Button variant="outline" size="sm" asChild>
							<Link to="/admin">Administration</Link>
						</Button>
					) : null}
					<Button variant="outline" size="sm" asChild>
						<Link to="/account">Account</Link>
					</Button>
					<ThemeToggle />
				</div>
			</div>
			<div className="mx-auto max-w-lg space-y-6">
				{linkedLogin ? (
					<p className="text-muted-foreground text-sm" role="status">
						GitHub identity verified for pckg as @{linkedLogin}.
					</p>
				) : null}
				<ProfileCard user={session}>
					<p className="text-muted-foreground text-sm">
						Signed in via GitHub. Continue to a Beskid app below or sign out.
					</p>
					<ul className="mt-4 space-y-2">
						{apps.map((app) => (
							<li key={app.id}>
								<a
									href={app.loginUrl}
									className="text-primary text-sm underline-offset-4 hover:underline"
								>
									Open {app.label}
								</a>
							</li>
						))}
					</ul>
					<form action="/api/auth/logout" method="post" className="mt-6">
						<Button type="submit" variant="outline">
							Sign out
						</Button>
					</form>
				</ProfileCard>
			</div>
		</div>
	);
}

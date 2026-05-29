import { createFileRoute, Link } from "@tanstack/react-router";

import {
	Button,
	ServicePicker,
} from "@beskid/ui-react";
import { ThemeToggle } from "#/components/theme-toggle";
import { fetchHomeData } from "#/server/app-server.functions";

export const Route = createFileRoute("/")({
	loader: () => fetchHomeData(),
	component: HomePage,
});

function HomePage() {
	const { apps, session, hubBase } = Route.useLoaderData();

	return (
		<div className="page-wrap">
			<div className="auth-topbar">
				<p className="island-kicker">Beskid</p>
				<div className="flex items-center gap-2">
					{session ? (
						<Button variant="outline" size="sm" asChild>
							<Link to="/profile">Profile</Link>
						</Button>
					) : (
						<Button variant="outline" size="sm" asChild>
							<a href={`${hubBase}/login?app=hub`}>Sign in</a>
						</Button>
					)}
					<ThemeToggle />
				</div>
			</div>
			<main className="py-10">
				<div className="mx-auto max-w-lg space-y-6">
					<div className="text-center">
						<h1 className="display-title text-3xl font-bold tracking-tight">
							Sign in with GitHub
						</h1>
						<p className="text-muted-foreground mt-3 text-sm">
							One OAuth app for Tracker, Nexus, and the package registry.
						</p>
					</div>
					<ServicePicker
						services={apps.map((app) => ({
							id: app.id,
							label: app.label,
							description: app.description,
							href: app.loginUrl,
						}))}
					/>
					<p className="text-muted-foreground text-center text-xs">
						<a
							href="https://beskid-lang.org/platform-spec/"
							className="underline-offset-4 hover:underline"
						>
							Platform specification
						</a>
					</p>
				</div>
			</main>
		</div>
	);
}

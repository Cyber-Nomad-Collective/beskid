import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";

import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@beskid/ui-react";
import { ThemeToggle } from "#/components/theme-toggle";
import { env } from "#/env";
import { fetchAdminAccess } from "#/server/app-server";

export const Route = createFileRoute("/admin/")({
	loader: async () => {
		const access = await fetchAdminAccess();
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") {
			throw redirect({ to: "/login", search: { app: "hub" } });
		}
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		return access;
	},
	component: AdminPage,
});

function AdminPage() {
	const { session } = Route.useLoaderData();
	const [message, setMessage] = useState<string | null>(null);
	const hubBase = env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");

	async function refreshStatus() {
		const res = await fetch("/api/v1/admin/status");
		const body = await res.json();
		setMessage(JSON.stringify(body, null, 2));
	}

	return (
		<div className="page-wrap py-10">
			<div className="auth-topbar">
				<Link to="/" className="island-kicker hover:underline">
					Beskid Auth
				</Link>
				<ThemeToggle />
			</div>
			<div className="mx-auto max-w-2xl space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Administration</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Signed in as @{session.login}
					</p>
				</div>
				<Alert>
					<AlertTitle>OAuth hub</AlertTitle>
					<AlertDescription>
						GitHub OAuth callback:{" "}
						<code className="text-xs">{hubBase}/callback</code>
					</AlertDescription>
				</Alert>
				<Card>
					<CardHeader>
						<CardTitle>API</CardTitle>
						<CardDescription>
							OpenAPI v1 at{" "}
							<a href="/api/v1/openapi.json" className="underline">
								/api/v1/openapi.json
							</a>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Link
							to="/admin/pairing"
							className="inline-flex h-9 items-center justify-center rounded-4xl border px-4 text-sm font-medium"
						>
							Service pairing
						</Link>
						<Button type="button" onClick={refreshStatus}>
							Refresh admin status
						</Button>
						{message ? (
							<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
								{message}
							</pre>
						) : null}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Consumer apps</CardTitle>
						<CardDescription>
							Re-run onboarding to update GitHub OAuth credentials and app URLs.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" asChild>
							<Link to="/onboarding">Open onboarding</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

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
	Input,
	Label,
} from "@beskid/ui-react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ThemeToggle } from "#/components/theme-toggle";
import { fetchAdminDashboard } from "#/server/app-server.functions";

export const Route = createFileRoute("/admin/")({
	loader: async () => {
		const access = await fetchAdminDashboard();
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
	const { session, hubBase, admins: initialAdmins } = Route.useLoaderData();
	const [admins, setAdmins] = useState(initialAdmins);
	const [newLogin, setNewLogin] = useState("");
	const [adminError, setAdminError] = useState<string | null>(null);
	const [adminBusy, setAdminBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function refreshStatus() {
		const res = await fetch("/api/v1/admin/status");
		const body = await res.json();
		setMessage(JSON.stringify(body, null, 2));
	}

	async function addAdmin(event: React.FormEvent) {
		event.preventDefault();
		setAdminBusy(true);
		setAdminError(null);
		const res = await fetch("/api/v1/admin/admins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ login: newLogin.trim() }),
		});
		setAdminBusy(false);
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			setAdminError(body.error ?? "Failed to add admin");
			return;
		}
		const body = (await res.json()) as { admins: string[] };
		setAdmins(body.admins);
		setNewLogin("");
	}

	async function removeAdmin(login: string) {
		setAdminBusy(true);
		setAdminError(null);
		const res = await fetch(
			`/api/v1/admin/admins?login=${encodeURIComponent(login)}`,
			{ method: "DELETE" },
		);
		setAdminBusy(false);
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			setAdminError(body.error ?? "Failed to remove admin");
			return;
		}
		const body = (await res.json()) as { admins: string[] };
		setAdmins(body.admins);
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
						GitHub OAuth callback: <code className="text-xs">{hubBase}/callback</code>
					</AlertDescription>
				</Alert>
				<Card>
					<CardHeader>
						<CardTitle>Hub admins</CardTitle>
						<CardDescription>
							GitHub logins with access to pairing and hub settings.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{adminError ? (
							<p className="text-destructive text-sm" role="alert">
								{adminError}
							</p>
						) : null}
						<ul className="space-y-2">
							{admins.map((login) => (
								<li
									key={login}
									className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
								>
									<span>@{login}</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={adminBusy}
										onClick={() => removeAdmin(login)}
									>
										Remove
									</Button>
								</li>
							))}
						</ul>
						<form onSubmit={addAdmin} className="flex flex-col gap-2 sm:flex-row">
							<div className="flex-1 space-y-1">
								<Label htmlFor="newAdminLogin" className="sr-only">
									GitHub login
								</Label>
								<Input
									id="newAdminLogin"
									value={newLogin}
									onChange={(event) => setNewLogin(event.target.value)}
									placeholder="github-username"
									disabled={adminBusy}
								/>
							</div>
							<Button type="submit" disabled={adminBusy || !newLogin.trim()}>
								Add admin
							</Button>
						</form>
					</CardContent>
				</Card>
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

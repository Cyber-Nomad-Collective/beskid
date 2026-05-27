import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@beskid/ui-react";
import { ThemeToggle } from "#/components/theme-toggle";
import { fetchAdminAccess } from "#/server/app-server";
import { listPairingRequests } from "#/server/repositories/pairing";

export const Route = createFileRoute("/admin/pairing/")({
	loader: async () => {
		const access = await fetchAdminAccess();
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") {
			throw redirect({ to: "/login", search: { app: "hub" } });
		}
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		return { requests: listPairingRequests() };
	},
	component: PairingListPage,
});

function PairingListPage() {
	const { requests } = Route.useLoaderData();

	return (
		<div className="page-wrap py-10">
			<div className="auth-topbar">
				<Link to="/admin" className="island-kicker hover:underline">
					← Admin
				</Link>
				<ThemeToggle />
			</div>
			<div className="mx-auto max-w-2xl space-y-6">
				<div className="flex items-center justify-between gap-4">
					<h1 className="text-2xl font-bold">Service pairing</h1>
					<Link
						to="/admin/pairing/new"
						className="inline-flex h-9 items-center justify-center rounded-4xl bg-primary px-4 text-sm font-medium text-primary-foreground"
					>
						New pairing
					</Link>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Recent requests</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{requests.length === 0 ? (
							<p className="text-muted-foreground text-sm">No pairing requests yet.</p>
						) : (
							requests.map((row) => (
								<div
									key={row.id}
									className="rounded-lg border p-3 text-sm"
								>
									<p className="font-medium">
										{row.app_id} — {row.status}
									</p>
									<p className="text-muted-foreground">{row.public_url}</p>
									<p className="text-muted-foreground text-xs">
										Expires {row.expires_at}
									</p>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@beskid/ui-react";
import { ThemeToggle } from "#/components/theme-toggle";
import { authAppLabel } from "#/lib/auth-app-meta";
import {
	cancelPairingRequestFn,
	fetchPairingRequests,
} from "#/server/app-server.functions";

export const Route = createFileRoute("/admin/pairing/")({
	loader: async () => {
		const access = await fetchPairingRequests();
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") {
			throw redirect({ to: "/login", search: { app: "hub" } });
		}
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		return { requests: access.requests };
	},
	component: PairingListPage,
});

function PairingListPage() {
	const { requests } = Route.useLoaderData();
	const router = useRouter();
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function onCancel(requestId: string) {
		setBusyId(requestId);
		setError(null);
		try {
			await cancelPairingRequestFn({ data: { requestId } });
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to cancel request");
		} finally {
			setBusyId(null);
		}
	}

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
				{error ? <p className="text-destructive text-sm">{error}</p> : null}
				<Card>
					<CardHeader>
						<CardTitle>Recent requests</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{requests.length === 0 ? (
							<p className="text-muted-foreground text-sm">No pairing requests yet.</p>
						) : (
							requests.map((row) => {
								const expired =
									row.status === "pending" &&
									new Date(row.expires_at).getTime() < Date.now();
								const canCancel = row.status === "pending" && !expired;
								const appLabel = authAppLabel(row.app_id);

								return (
									<div
										key={row.id}
										className="rounded-lg border p-3 text-sm"
									>
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div>
												<p className="font-medium">
													{appLabel} — {row.status}
													{expired ? " (expired)" : ""}
												</p>
												<p className="text-muted-foreground">{row.public_url}</p>
												<p className="text-muted-foreground text-xs">
													Expires {row.expires_at}
												</p>
											</div>
											<div className="flex flex-wrap gap-2">
												<Link
													to="/admin/pairing/$requestId"
													params={{ requestId: row.id }}
													className="inline-flex h-8 items-center justify-center rounded-4xl border px-3 text-xs font-medium"
												>
													Details
												</Link>
												{canCancel ? (
													<Button
														type="button"
														variant="outline"
														size="sm"
														disabled={busyId === row.id}
														onClick={() => onCancel(row.id)}
													>
														{busyId === row.id ? "Cancelling…" : "Cancel"}
													</Button>
												) : null}
											</div>
										</div>
									</div>
								);
							})
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

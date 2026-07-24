import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@beskid/ui-react";
import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { ThemeToggle } from "#/components/theme-toggle";
import { authAppLabel } from "#/lib/auth-app-meta";
import {
	cancelPairingRequestFn,
	fetchPairingRequestDetail,
} from "#/server/app-server.functions";

export const Route = createFileRoute("/admin/pairing/$requestId")({
	loader: async ({ params }) => {
		const access = await fetchPairingRequestDetail({
			data: { requestId: params.requestId },
		});
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") {
			throw redirect({ to: "/login", search: { app: "hub" } });
		}
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		if (access.kind === "not_found") throw redirect({ to: "/admin/pairing" });
		return { request: access.request, audit: access.audit };
	},
	component: PairingDetailPage,
});

function PairingDetailPage() {
	const { request, audit } = Route.useLoaderData();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const expired =
		request.status === "pending" &&
		new Date(request.expires_at).getTime() < Date.now();
	const canCancel = request.status === "pending" && !expired;

	async function onCancel() {
		if (!canCancel) return;
		setBusy(true);
		setError(null);
		try {
			await cancelPairingRequestFn({ data: { requestId: request.id } });
			await router.invalidate();
			await router.navigate({ to: "/admin/pairing" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to cancel request");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="page-wrap py-10">
			<div className="auth-topbar">
				<Link to="/admin/pairing" className="island-kicker hover:underline">
					← Pairing
				</Link>
				<ThemeToggle />
			</div>
			<div className="mx-auto max-w-2xl space-y-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold">Pairing request</h1>
						<p className="text-muted-foreground text-sm">
							{authAppLabel(request.app_id)}
						</p>
					</div>
					{canCancel ? (
						<Button
							type="button"
							variant="destructive"
							disabled={busy}
							onClick={onCancel}
						>
							{busy ? "Cancelling…" : "Cancel request"}
						</Button>
					) : null}
				</div>

				{error ? <p className="text-destructive text-sm">{error}</p> : null}

				<Card>
					<CardHeader>
						<CardTitle>Details</CardTitle>
						<CardDescription>Request id {request.id}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p>
							<strong>Status:</strong> {request.status}
							{expired ? " (expired)" : ""}
						</p>
						<p>
							<strong>Public URL:</strong> {request.public_url}
						</p>
						<p>
							<strong>Created by:</strong> {request.created_by_login}
						</p>
						<p>
							<strong>Created:</strong> {request.created_at}
						</p>
						<p>
							<strong>Expires:</strong> {request.expires_at}
						</p>
						<p className="text-muted-foreground">
							Pairing codes are shown once when the request is created. Share a new
							request if the code was lost.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Audit trail</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						{audit.length === 0 ? (
							<p className="text-muted-foreground">No audit events yet.</p>
						) : (
							audit.map((row) => (
								<div key={row.id} className="rounded-lg border p-3">
									<p className="font-medium">{row.event}</p>
									<p className="text-muted-foreground text-xs">
										{row.created_at}
										{row.actor_login ? ` — ${row.actor_login}` : ""}
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

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";

import type { AuthAppId } from "@beskid/auth-client";
import { AUTH_APP_META } from "@beskid/auth-client";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@beskid/ui-react";
import { ThemeToggle } from "#/components/theme-toggle";
import { fetchAdminAccess } from "#/server/app-server";

const APP_IDS: AuthAppId[] = ["tracker", "nexus", "pckg"];

export const Route = createFileRoute("/admin/pairing/new")({
	loader: async () => {
		const access = await fetchAdminAccess();
		if (access.kind === "onboarding") throw redirect({ to: "/onboarding" });
		if (access.kind === "login") {
			throw redirect({ to: "/login", search: { app: "hub" } });
		}
		if (access.kind === "profile") throw redirect({ to: "/profile" });
		return null;
	},
	component: NewPairingPage,
});

function NewPairingPage() {
	const [appId, setAppId] = useState<AuthAppId>("tracker");
	const [publicUrl, setPublicUrl] = useState("");
	const [result, setResult] = useState<{
		pairingCode: string;
		approveUrlTemplate: string;
		expiresAt: string;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		const res = await fetch("/api/v1/pairing/requests", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ appId, publicUrl: publicUrl.trim() }),
		});
		setBusy(false);
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			setError(body.error ?? "Failed to create pairing request");
			return;
		}
		const body = (await res.json()) as {
			pairingCode: string;
			approveUrlTemplate: string;
			expiresAt: string;
		};
		setResult(body);
	}

	return (
		<div className="page-wrap py-10">
			<div className="auth-topbar">
				<Link to="/admin/pairing" className="island-kicker hover:underline">
					← Pairing
				</Link>
				<ThemeToggle />
			</div>
			<div className="mx-auto max-w-lg space-y-6">
				<h1 className="text-2xl font-bold">New pairing request</h1>
				<Card>
					<CardHeader>
						<CardTitle>Consumer app</CardTitle>
						<CardDescription>
							Enter the app public URL only. Share the pairing code with the app owner.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={onSubmit}>
							<div className="space-y-2">
								<Label htmlFor="appId">App</Label>
								<select
									id="appId"
									className="w-full rounded-md border px-3 py-2 text-sm"
									value={appId}
									onChange={(e) => setAppId(e.target.value as AuthAppId)}
								>
									{APP_IDS.map((id) => (
										<option key={id} value={id}>
											{AUTH_APP_META[id].label}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="publicUrl">Public URL</Label>
								<Input
									id="publicUrl"
									type="url"
									required
									value={publicUrl}
									onChange={(e) => setPublicUrl(e.target.value)}
									placeholder="https://tracker.beskid-lang.org"
								/>
							</div>
							{error ? (
								<p className="text-destructive text-sm">{error}</p>
							) : null}
							<Button type="submit" disabled={busy}>
								{busy ? "Creating…" : "Create pairing request"}
							</Button>
						</form>
					</CardContent>
				</Card>
				{result ? (
					<Card>
						<CardHeader>
							<CardTitle>Share with app owner</CardTitle>
							<CardDescription>Code shown once. Expires {result.expiresAt}.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p>
								<strong>Code:</strong>{" "}
								<code className="rounded bg-muted px-2 py-1">{result.pairingCode}</code>
							</p>
							<p>
								<strong>Approve link:</strong>{" "}
								<a className="break-all underline" href={result.approveUrlTemplate}>
									{result.approveUrlTemplate}
								</a>
							</p>
						</CardContent>
					</Card>
				) : null}
			</div>
		</div>
	);
}

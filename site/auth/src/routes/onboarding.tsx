import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";

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
import { env } from "#/env";
import { fetchOnboardingGate } from "#/server/app-server";

export const Route = createFileRoute("/onboarding")({
	loader: async () => {
		const { onboarded } = await fetchOnboardingGate();
		if (onboarded) throw redirect({ to: "/admin" });
		return {
			defaultCallback: `${env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "")}/callback`,
		};
	},
	component: OnboardingPage,
});

function OnboardingPage() {
	const { defaultCallback } = Route.useLoaderData();
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		const form = new FormData(event.currentTarget);
		const payload = {
			setupToken: String(form.get("setupToken") ?? "").trim() || undefined,
			githubClientId: String(form.get("githubClientId") ?? "").trim(),
			githubClientSecret: String(form.get("githubClientSecret") ?? "").trim(),
			githubOAuthCallbackUrl: String(
				form.get("githubOAuthCallbackUrl") ?? defaultCallback,
			).trim(),
			adminGitHubLogins: String(form.get("adminGitHubLogins") ?? "")
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean),
		};

		const res = await fetch("/api/v1/admin/setup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		setBusy(false);
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			setError(body.error ?? "Setup failed");
			return;
		}
		window.location.href = "/admin";
	}

	return (
		<div className="page-wrap py-10">
			<div className="auth-topbar">
				<Link to="/" className="island-kicker hover:underline">
					Beskid Auth
				</Link>
				<ThemeToggle />
			</div>
			<form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Hub onboarding</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Configure the shared GitHub OAuth app. Pair tracker, nexus, and pckg later
						from Admin → Pairing.
					</p>
				</div>
				{error ? (
					<p className="text-destructive text-sm" role="alert">
						{error}
					</p>
				) : null}
				<Card>
					<CardHeader>
						<CardTitle>GitHub OAuth App</CardTitle>
						<CardDescription>
							Create one OAuth app with callback URL below.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="setupToken">Setup token (if configured)</Label>
							<Input id="setupToken" name="setupToken" type="password" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="githubClientId">Client ID</Label>
							<Input id="githubClientId" name="githubClientId" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="githubClientSecret">Client secret</Label>
							<Input
								id="githubClientSecret"
								name="githubClientSecret"
								type="password"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="githubOAuthCallbackUrl">Callback URL</Label>
							<Input
								id="githubOAuthCallbackUrl"
								name="githubOAuthCallbackUrl"
								defaultValue={defaultCallback}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="adminGitHubLogins">Admin GitHub logins</Label>
							<Input
								id="adminGitHubLogins"
								name="adminGitHubLogins"
								placeholder="login1, login2"
								required
							/>
						</div>
					</CardContent>
				</Card>
				<Button type="submit" disabled={busy} className="w-full">
					{busy ? "Saving…" : "Complete setup"}
				</Button>
			</form>
		</div>
	);
}

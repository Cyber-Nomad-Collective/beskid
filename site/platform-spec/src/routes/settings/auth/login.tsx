import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { ThemeToggle } from "#/components/theme-toggle";
import { getAuthUser } from "#/server/auth";
import {
	getAuthHubLoginHrefFn,
	getAuthHubPairingStatusFn,
} from "#/server/auth-hub-pairing";

const searchSchema = z.object({
	error: z.string().optional(),
	next: z.string().optional(),
});

export const Route = createFileRoute("/settings/auth/login")({
	validateSearch: searchSchema,
	loader: async ({ location }) => {
		const { paired } = await getAuthHubPairingStatusFn();
		if (!paired) {
			throw redirect({ to: "/settings/auth/pair" });
		}

		const user = await getAuthUser();
		if (user) {
			const next = new URLSearchParams(location.search).get("next");
			throw redirect({ to: next?.startsWith("/") ? next : "/edit" });
		}

		const { signInHref } = await getAuthHubLoginHrefFn();
		return { signInHref, error: searchSchema.parse(location.search).error };
	},
	component: LoginPage,
});

function LoginPage() {
	const { signInHref, error } = Route.useLoaderData();
	const search = Route.useSearch();
	const nextParam = search.next ? `?next=${encodeURIComponent(search.next)}` : "";

	return (
		<div className="relative flex min-h-screen items-center justify-center p-8">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<div className="mx-auto max-w-md space-y-6 text-center">
				<h1 className="text-2xl font-semibold">Sign in</h1>
				<p className="text-sm text-muted-foreground">
					Platform Spec uses the shared Beskid Auth hub for GitHub sign-in.
				</p>
				{error ? (
					<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						Sign-in failed. Try again.
					</p>
				) : null}
				<a
					href={`${signInHref}${nextParam}`}
					className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
				>
					Sign in with GitHub
				</a>
				<p className="text-xs text-muted-foreground">
					<Link to="/settings/auth/pair" className="underline">
						Auth hub settings
					</Link>
				</p>
			</div>
		</div>
	);
}

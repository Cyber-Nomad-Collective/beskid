import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { AuthPageShell, Button } from "@beskid/ui-react";
import { ThemeToggle } from "#/components/theme-toggle";
import { env } from "#/env";
import { getAppById, isOAuthConfigured, resolveOAuthConfig } from "#/server/config-store";
import { buildGitHubAuthorizeUrl } from "#/server/github-oauth";
import { buildOAuthState, oauthStateCookieHeader } from "#/server/oauth-cookies";

const loginSearchSchema = z.object({
	app: z.string().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/login")({
	validateSearch: loginSearchSchema,
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const app = url.searchParams.get("app")?.trim();
				if (!app) return undefined;

				if (!(await isOAuthConfigured())) {
					return new Response(null, {
						status: 302,
						headers: { Location: "/onboarding" },
					});
				}

				if (app !== "hub") {
					const consumer = await getAppById(app);
					if (!consumer) {
						return new Response(null, {
							status: 302,
							headers: { Location: "/?error=unknown_app" },
						});
					}
				}

				const nonce = crypto.randomUUID();
				const state = buildOAuthState(nonce, app);
				const cfg = await resolveOAuthConfig();
				const headers = new Headers();
				headers.set("Location", buildGitHubAuthorizeUrl(cfg, state));
				headers.append("Set-Cookie", oauthStateCookieHeader(state));
				return new Response(null, { status: 302, headers });
			},
		},
	},
	component: LoginPage,
});

function errorMessage(code?: string) {
	switch (code) {
		case "oauth_state":
			return "Sign-in expired or was interrupted. Try again.";
		case "oauth_failed":
			return "GitHub sign-in failed. Check OAuth app settings.";
		default:
			return null;
	}
}

function LoginPage() {
	const { error } = Route.useSearch();
	const hubBase = env.AUTH_HUB_PUBLIC_URL.replace(/\/$/, "");

	return (
		<div className="page-wrap relative">
			<div className="absolute top-4 right-0">
				<ThemeToggle />
			</div>
			<AuthPageShell
				title="Account"
				description="Sign in to manage your Beskid profile on the auth hub."
				error={errorMessage(error) ?? undefined}
				footer={
					<a
						href="https://beskid-lang.org/platform-spec/"
						className="underline-offset-4 hover:underline"
					>
						Platform specification
					</a>
				}
			>
				<Button size="lg" asChild className="w-full">
					<a href={`${hubBase}/login?app=hub`}>Sign in with GitHub</a>
				</Button>
				<p className="text-muted-foreground text-center text-xs">
					<Link to="/" className="underline-offset-4 hover:underline">
						Back to services
					</Link>
				</p>
			</AuthPageShell>
		</div>
	);
}

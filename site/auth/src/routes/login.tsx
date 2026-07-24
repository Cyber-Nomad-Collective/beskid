import { AuthPageShell, Button } from "@beskid/ui-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ThemeToggle } from "#/components/theme-toggle";
import { fetchLoginPageContext } from "#/server/app-server.functions";
import { handleLoginGet } from "#/server/oauth.server";

const loginSearchSchema = z.object({
	app: z.string().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/login")({
	validateSearch: loginSearchSchema,
	loader: () => fetchLoginPageContext(),
	server: {
		handlers: {
			GET: ({ request }) => handleLoginGet(request),
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
	const { hubBase } = Route.useLoaderData();

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
						href="https://spec.beskid-lang.org/platform-spec/"
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

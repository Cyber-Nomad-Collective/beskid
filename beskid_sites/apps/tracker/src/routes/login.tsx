import { ThemeToggle } from "@cyber-nomad-collective/beskid-shell-core";
import { AuthPageShell, Button } from "@cyber-nomad-collective/beskid-ui-react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const loginSearchSchema = z.object({
	error: z.string().optional(),
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
	validateSearch: loginSearchSchema,
	component: LoginPage,
});

function LoginPage() {
	const { error } = Route.useSearch();

	return (
		<div className="page-wrap relative">
			<div className="absolute top-4 right-0">
				<ThemeToggle />
			</div>
			<AuthPageShell
				kicker="Beskid"
				title="Tracker"
				description="Sign in through Authelia (GitHub identity) to manage tracker-native roadmap tasks. GitHub is used only for public bug issues."
				error={error ? "Sign-in failed. Try again." : undefined}
				footer={
					<>
						<a
							href="https://beskid-lang.org/platform-spec/"
							className="underline-offset-4 hover:underline"
						>
							Platform specification
						</a>
						{" · "}
						<a
							href="https://github.com/Cyber-Nomad-Collective/beskid/blob/main/beskid_sites/apps/tracker/README.md"
							target="_blank"
							rel="noopener noreferrer"
							className="underline-offset-4 hover:underline"
						>
							tracker README
						</a>
					</>
				}
			>
				<Button size="lg" asChild className="w-full">
					<a href="/api/auth/login">Sign in with GitHub</a>
				</Button>
			</AuthPageShell>
		</div>
	);
}

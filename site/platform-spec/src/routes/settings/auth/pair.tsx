import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { z } from "zod";

import { AuthHubSetupWizard } from "#/components/auth-hub-setup-wizard";
import { ThemeToggle } from "#/components/theme-toggle";
import { getAuthHubPairingStatusFn } from "#/server/auth-hub-pairing";
import { getAuthHubSetupStatusFn } from "#/server/auth-hub-setup";

const searchSchema = z.object({
	code: z.string().optional(),
	pair_error: z.string().optional(),
});

export const Route = createFileRoute("/settings/auth/pair")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		code: search.code,
		pair_error: search.pair_error,
	}),
	loader: async ({ deps }) => {
		const code = deps.code?.trim();
		if (code) {
			throw redirect({
				to: "/api/auth/pair",
				search: { code },
			});
		}

		const [setup, pairing] = await Promise.all([
			getAuthHubSetupStatusFn(),
			getAuthHubPairingStatusFn(),
		]);

		return {
			paired: pairing.paired,
			pairError: deps.pair_error?.trim() || null,
			setupDefaults: {
				defaultAuthHubUrl:
					setup.defaultAuthHubUrl ??
					setup.authHubUrl ??
					"https://auth.beskid-lang.org",
				defaultPlatformSpecPublicUrl: setup.defaultPlatformSpecPublicUrl,
				storedApproverLogin: setup.storedApproverLogin ?? "",
				hasSessionSecret: setup.hasSessionSecret,
				hasSetupToken: setup.hasSetupToken,
			},
		};
	},
	component: AuthHubPairPage,
});

function AuthHubPairPage() {
	const router = useRouter();
	const { paired, pairError, setupDefaults } = Route.useLoaderData();

	return (
		<div className="relative min-h-screen p-8">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<div className="mx-auto max-w-xl space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-semibold">
						{paired ? "Auth hub pairing" : "Platform Spec onboarding"}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{paired
							? "This service is connected to the shared auth hub."
							: "Pair with the auth hub before sign-in and editing."}
					</p>
				</div>

				{paired ? (
					<div className="space-y-4 text-center">
						<p className="rounded-lg border px-4 py-3 text-sm">
							Platform Spec is paired with the auth hub.
						</p>
						<Link to="/edit" className="text-sm underline">
							Continue to editor
						</Link>
					</div>
				) : (
					<>
						{pairError ? (
							<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{pairError}
							</p>
						) : null}
						<AuthHubSetupWizard
							{...setupDefaults}
							onComplete={() => {
								void router.navigate({ to: "/edit" });
							}}
						/>
					</>
				)}
			</div>
		</div>
	);
}

import {
	Button,
	Card,
	CardContent,
	Input,
} from "@cyber-nomad-collective/beskid-ui-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PckgApiError, pckgApi } from "#/lib/api";

export const Route = createFileRoute("/dashboard/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const session = useQuery({
		queryKey: ["session"],
		queryFn: () => pckgApi.getSession(),
	});
	const profile = useQuery({
		queryKey: ["community-profile", "me"],
		enabled: Boolean(session.data),
		queryFn: () => {
			const subject = session.data?.subject;
			if (!subject)
				throw new Error("An authenticated session is required to load a profile.");
			return pckgApi.getCommunityProfile(subject);
		},
		retry: false,
	});
	const queryClient = useQueryClient();
	const update = useMutation({
		mutationFn: pckgApi.updateMyCommunityProfile,
		onSuccess: () =>
			void queryClient.invalidateQueries({
				queryKey: ["community-profile", "me"],
			}),
	});

	if (session.isPending || profile.isPending)
		return <p className="text-muted-foreground">Loading profile…</p>;
	if (session.isError) throw session.error;

	const initial = profile.data;
	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		// Social links are now managed on the NodeBB community site; the pckg
		// profile only carries display name + bio. Send an empty social_links
		// array to keep the API contract intact (pckg-api.ts is a verbatim lift
		// and is not modified here).
		await update.mutateAsync({
			display_name: String(form.get("displayName") ?? "").trim(),
			bio: String(form.get("bio") ?? ""),
			social_links: [],
		});
	};

	return (
		<section className="mx-auto max-w-2xl space-y-6 px-5 py-10">
			<header>
				<h1 className="text-3xl font-bold">Profile settings</h1>
				<p className="mt-2 text-muted-foreground">
					Signed in as {session.data?.githubLogin}. This profile is keyed by your
					GitHub-backed Auth Hub subject. Community presence (follows, social links)
					lives on community.beskid-lang.org.
				</p>
			</header>
			<Card>
				<CardContent className="pt-6">
					<form className="space-y-4" onSubmit={submit}>
						<label className="grid gap-2 text-sm font-medium" htmlFor="displayName">
							Display name
							<Input
								id="displayName"
								name="displayName"
								required
								defaultValue={initial?.display_name ?? session.data?.githubLogin ?? ""}
							/>
						</label>
						<label className="grid gap-2 text-sm font-medium" htmlFor="bio">
							Biography
							<textarea
								id="bio"
								className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
								name="bio"
								defaultValue={initial?.bio ?? ""}
							/>
						</label>
						{profile.isError &&
							!(
								profile.error instanceof PckgApiError && profile.error.status === 404
							) && (
								<p className="text-sm text-destructive">
									Could not load the existing profile.
								</p>
							)}
						{update.isError && (
							<p className="text-sm text-destructive">Could not save the profile.</p>
						)}
						<Button type="submit" disabled={update.isPending}>
							{update.isPending ? "Saving…" : "Save profile"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</section>
	);
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { PublisherProfile } from "#/components/publisher-profile";
import { PckgApiError, pckgApi } from "#/lib/api";

export const Route = createFileRoute("/_public/publishers/$name")({
	component: PublisherPage,
});

function PublisherPage() {
	const { name } = useParams({ from: "/_public/publishers/$name" });
	const profile = useQuery({
		queryKey: ["community-profile", name],
		queryFn: () => pckgApi.getCommunityProfile(name),
		retry: false,
	});
	const packages = useQuery({
		queryKey: ["publisher-packages", name],
		queryFn: () => pckgApi.listPublisherPackages(name),
	});

	if (profile.isPending)
		return <p className="text-muted-foreground">Loading publisher profile…</p>;
	if (
		profile.isError &&
		profile.error instanceof PckgApiError &&
		profile.error.status === 404
	) {
		return (
			<section className="mx-auto max-w-6xl px-5 py-10">
				<h1 className="text-3xl font-bold">{name}</h1>
				<p className="mt-3 text-muted-foreground">
					No public profile exists for this Auth Hub subject.
				</p>
			</section>
		);
	}
	if (profile.isError) throw profile.error;
	if (packages.isError) throw packages.error;

	return (
		<PublisherProfile profile={profile.data} packages={packages.data ?? []} />
	);
}

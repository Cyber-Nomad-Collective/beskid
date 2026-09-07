import type { CommunityProfile, PackageSummary } from "#/lib/pckg-api";
import { PackageGrid } from "./package-grid";

/**
 * Publisher profile page — the "profile" the user wants preserved (research
 * doc §2.2).
 *
 * Community features (follows, social links) now live on the NodeBB community
 * site (community.beskid-lang.org); this page only surfaces the publisher's
 * identity and published packages.
 *
 * Layout:
 *  1. Hero — display name + bio.
 *  2. "Published packages" — reuses the shared {@link PackageGrid}.
 *
 * Presentational: the route owns the queries and passes data. The 404 "no
 * public profile" case is handled by the route (renders a dedicated card)
 * before mounting this component.
 */
export function PublisherProfile({
	profile,
	packages,
}: {
	profile: CommunityProfile;
	packages: PackageSummary[];
}) {
	return (
		<section className="mx-auto max-w-6xl px-5 py-10">
			<div>
				<h1 className="text-3xl font-bold">{profile.display_name}</h1>
				<p className="mt-3 text-muted-foreground">
					{profile.bio || "No biography provided."}
				</p>
			</div>
			<section className="mt-8">
				<h2 className="text-xl font-semibold">Published packages</h2>
				<div className="mt-3">
					<PackageGrid
						items={packages}
						emptyMessage="This publisher has no public packages yet."
					/>
				</div>
			</section>
		</section>
	);
}

import { Badge, buttonVariants } from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";
import type { PackageDetails } from "#/lib/pckg-api";
import { FactsCard } from "./facts-card";
import { NodebbLink } from "./nodebb-link";
import { VersionList } from "./version-list";

/**
 * Package detail page — the signature "nice" page (research doc §2.1).
 *
 * Layout (top → bottom):
 *  1. Hero — category eyebrow + name + description + Download /
 *     Documentation action pair + NodeBB "Discuss" deep-link (community
 *     discussion lives on community.beskid-lang.org; in-app reviews were
 *     removed in favour of NodeBB subforums).
 *  2. Tag strip of secondary badges.
 *  3. Facts card — 2-col muted grid (downloads, owner, updated, dependents,
 *     repo, website).
 *  4. README section (surfaces `PackageDetails.readme`).
 *  5. Dependencies section (surfaces `PackageDetails.dependencies`).
 *  6. Versions — bordered list.
 *
 * Presentational: the route owns the queries/mutations and passes data.
 */
export function PackageDetail({
	details,
	communitySlug,
}: {
	details: PackageDetails;
	communitySlug?: string;
}) {
	const { package: pkg } = details;
	return (
		<section className="mx-auto max-w-6xl px-5 py-10">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-primary">{pkg.category}</p>
					<h1 className="mt-1 text-3xl font-bold">{pkg.name}</h1>
					<p className="mt-3 max-w-2xl text-muted-foreground">{pkg.description}</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{details.latestDownloadUrl && (
						<a className={buttonVariants()} href={details.latestDownloadUrl}>
							Download latest
							{details.latestVersion ? ` ${details.latestVersion}` : ""}
						</a>
					)}
					<Link
						to="/docs/$package"
						params={{ package: pkg.name }}
						search={{ version: details.latestVersion ?? "" }}
						className={buttonVariants({ variant: "outline" })}
					>
						Documentation
					</Link>
					<NodebbLink packageName={pkg.name} slug={communitySlug} />
				</div>
			</div>

			<div className="mt-6 flex flex-wrap gap-2">
				{pkg.tags.map((tag) => (
					<Badge key={tag} variant="secondary">
						{tag}
					</Badge>
				))}
			</div>

			<FactsCard>
				<span>{pkg.totalDownloads.toLocaleString()} downloads</span>
				<span>Published by {pkg.ownerDisplayName}</span>
				<span>Updated {new Date(pkg.updatedAtUtc).toLocaleDateString()}</span>
				<span>{details.dependentsCount.toLocaleString()} dependents</span>
				{pkg.repositoryUrl && (
					<a className="text-primary underline" href={pkg.repositoryUrl}>
						Source repository
					</a>
				)}
				{pkg.websiteUrl && (
					<a className="text-primary underline" href={pkg.websiteUrl}>
						Project website
					</a>
				)}
			</FactsCard>

			{details.readme && (
				<section className="mt-8">
					<h2 className="text-xl font-semibold">README</h2>
					<pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md border border-border p-4 text-sm">
						{details.readme}
					</pre>
				</section>
			)}

			{details.dependencies.length > 0 && (
				<section className="mt-8">
					<h2 className="text-xl font-semibold">Dependencies</h2>
					<ul className="mt-3 space-y-2">
						{details.dependencies.map((dep) => (
							<li
								key={`${dep.name}@${dep.version ?? ""}`}
								className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3 text-sm"
							>
								<span className="font-medium">{dep.name}</span>
								<span className="text-muted-foreground">
									{dep.version ?? "unpinned"} · {dep.source}
									{dep.registry ? ` · ${dep.registry}` : ""}
								</span>
							</li>
						))}
					</ul>
				</section>
			)}

			<h2 className="mt-8 text-xl font-semibold">Versions</h2>
			<VersionList packageName={pkg.name} versions={details.versions} />
		</section>
	);
}

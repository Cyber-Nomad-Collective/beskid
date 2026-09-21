import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";
import { packageKindPresentation } from "#/lib/package-kind-presentation";
import type { PackageSummary } from "#/lib/pckg-api";

/**
 * Shared package card — reused on the listing, publisher profile, and
 * my-packages pages (single component per the research doc §8.1).
 *
 * Mirrors the original registry card: title `Link`, description, then a
 * muted `flex flex-wrap` row of `{category} · {downloads} · {owner}` plus up
 * to 3 tag badges.
 */
export function PackageCard({ item }: { item: PackageSummary }) {
	const presentation = packageKindPresentation({
		kind: item.packageKind,
		packageName: item.name,
		latestVersion: null,
		templateShortName: item.template?.shortName,
	});
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Link
						to="/packages/$name"
						params={{ name: item.name }}
						className="hover:underline"
					>
						{item.name}
					</Link>
				</CardTitle>
				<CardDescription>{item.description}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
				<Badge>{presentation.badge}</Badge>
				<span>{item.category}</span>
				<span>·</span>
				<span>{item.totalDownloads.toLocaleString()} downloads</span>
				<span>·</span>
				<span>{item.ownerDisplayName}</span>
				{item.tags.slice(0, 3).map((tag) => (
					<Badge key={tag} variant="secondary">
						{tag}
					</Badge>
				))}
				{presentation.showDocumentation && (
					<Link
						to="/docs/$package"
						params={{ package: item.name }}
						search={{ version: "", doc: "", source: "" }}
						className="ml-auto font-medium text-primary hover:underline"
					>
						Docs
					</Link>
				)}
			</CardContent>
		</Card>
	);
}

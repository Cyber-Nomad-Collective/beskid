import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@cyber-nomad-collective/beskid-ui-react";
import { Link } from "@tanstack/react-router";
import type { PackageSummary } from "#/lib/pckg-api";

/**
 * Shared package card — reused on the listing, publisher profile, and
 * my-packages pages (single component per the research doc §8.1).
 *
 * Mirrors the original `pckg/web` card: title `Link`, description, then a
 * muted `flex flex-wrap` row of `{category} · {downloads} · {owner}` plus up
 * to 3 tag badges.
 */
export function PackageCard({ item }: { item: PackageSummary }) {
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
			<CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
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
			</CardContent>
		</Card>
	);
}

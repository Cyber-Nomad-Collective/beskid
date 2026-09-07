import { Card, CardContent } from "@cyber-nomad-collective/beskid-ui-react";
import type { PackageSummary } from "#/lib/pckg-api";
import { PackageCard } from "./package-card";

/**
 * Responsive grid of {@link PackageCard}s with a graceful empty-state card
 * spanning both columns. Reused on `/packages`, `/publishers/$name`, and
 * `/dashboard/my-packages`.
 */
export function PackageGrid({
	items,
	emptyMessage = "No packages match this search.",
}: {
	items: PackageSummary[];
	emptyMessage?: string;
}) {
	if (items.length === 0) {
		return (
			<div className="grid gap-4 md:grid-cols-2">
				<Card className="md:col-span-2">
					<CardContent className="py-8 text-muted-foreground">
						{emptyMessage}
					</CardContent>
				</Card>
			</div>
		);
	}
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{items.map((item) => (
				<PackageCard key={item.id} item={item} />
			))}
		</div>
	);
}

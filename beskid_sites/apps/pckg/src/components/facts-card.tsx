import { Card, CardContent } from "@cyber-nomad-collective/beskid-ui-react";
import type { ReactNode } from "react";

/**
 * Two-column "facts" card — a single `Card` with a responsive `sm:grid-cols-2`
 * muted grid of facts. Cheap, scannable metadata block (research doc §8.3).
 *
 * Each fact is rendered as a node; pass `<a>` elements for links so they keep
 * their underline + primary colour.
 */
export function FactsCard({ children }: { children: ReactNode }) {
	return (
		<Card className="mt-6">
			<CardContent className="grid gap-3 py-5 text-sm text-muted-foreground sm:grid-cols-2">
				{children}
			</CardContent>
		</Card>
	);
}

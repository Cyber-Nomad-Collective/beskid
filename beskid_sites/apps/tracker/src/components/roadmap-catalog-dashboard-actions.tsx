import { Link } from "@tanstack/react-router";

import { Button } from "#/components/ui/button";
import type { AuthUser } from "#/lib/github/types";

interface RoadmapCatalogDashboardActionsProps {
	user: AuthUser | null;
	versionId: string;
}

export function RoadmapCatalogDashboardActions({
	user,
	versionId,
}: RoadmapCatalogDashboardActionsProps) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button variant="outline" size="sm" asChild>
				<Link to="/">Roadmap</Link>
			</Button>
			{user ? (
				<Button size="sm" asChild>
					<Link
						to="/v/$version"
						params={{ version: versionId }}
						className="text-primary-foreground"
					>
						Open kanban board
					</Link>
				</Button>
			) : (
				<Button size="sm" asChild>
					<Link to="/login" className="text-primary-foreground">
						Sign in to manage roadmap
					</Link>
				</Button>
			)}
		</div>
	);
}

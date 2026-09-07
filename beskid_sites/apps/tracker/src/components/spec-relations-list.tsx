import { ExternalLink } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import type { SpecRelation } from "#/lib/platform-spec/relations";

const RELATION_LABEL: Record<SpecRelation["relation"], string> = {
	implements: "Implements",
	"depends-on": "Depends on",
	tracks: "Tracks",
	extends: "Extends",
	validates: "Validates",
};

interface SpecRelationsListProps {
	relations: SpecRelation[];
	approval?: "pending" | "approved";
	compact?: boolean;
}

export function SpecRelationsList({
	relations,
	approval,
	compact = false,
}: SpecRelationsListProps) {
	if (relations.length === 0 && !approval) return null;

	if (compact) {
		return (
			<div className="flex flex-wrap gap-1">
				{relations.slice(0, 2).map((relation) => (
					<Badge
						key={relation.path}
						variant="outline"
						className="max-w-full truncate font-normal"
					>
						{RELATION_LABEL[relation.relation]}:{" "}
						{relation.title ?? relation.path.split("/").at(-1)}
					</Badge>
				))}
				{relations.length > 2 ? (
					<Badge variant="secondary" className="font-normal">
						+{relations.length - 2}
					</Badge>
				) : null}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{approval ? (
				<Badge
					variant={approval === "approved" ? "default" : "secondary"}
					className="w-fit"
				>
					Spec {approval === "approved" ? "approved" : "pending approval"}
				</Badge>
			) : null}
			<div className={`flex flex-wrap gap-1.5 ${compact ? "" : "flex-col"}`}>
				{relations.map((relation) => (
					<div
						key={`${relation.path}-${relation.relation}`}
						className="border-border bg-muted/40 flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm"
					>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline" className="font-normal">
								{RELATION_LABEL[relation.relation]}
							</Badge>
							{relation.required ? (
								<Badge variant="destructive" className="font-normal">
									Required
								</Badge>
							) : null}
							{relation.level ? (
								<span className="text-muted-foreground text-xs capitalize">
									{relation.level}
								</span>
							) : null}
						</div>
						<a
							href={relation.href}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 font-medium hover:underline"
						>
							<span>{relation.title ?? relation.path.split("/").at(-1)}</span>
							<ExternalLink className="size-3 shrink-0" />
						</a>
						<span className="text-muted-foreground font-mono text-xs">
							{relation.path}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

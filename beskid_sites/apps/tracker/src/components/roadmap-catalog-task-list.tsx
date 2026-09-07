import { Badge } from "#/components/ui/badge";
import type { SeedTask } from "#/lib/seed/schemas";

interface RoadmapCatalogTaskListProps {
	tasks: SeedTask[];
	emptyMessage?: string;
}

export function RoadmapCatalogTaskList({
	tasks,
	emptyMessage = "No tasks in this view yet.",
}: RoadmapCatalogTaskListProps) {
	if (tasks.length === 0) {
		return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
	}

	return (
		<ul className="divide-y divide-border rounded-lg border border-border">
			{tasks.map((task) => (
				<li
					key={task.id}
					className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
				>
					<div className="min-w-0 flex-1">
						<p className="font-medium">{task.title}</p>
						<p className="text-muted-foreground font-mono text-xs">{task.id}</p>
						{task.body ? (
							<p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
								{task.body}
							</p>
						) : null}
						<p className="text-muted-foreground mt-1 font-mono text-xs">
							{task.source.repo} @ {task.source.commit.slice(0, 7)}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline">{task.statusColumn}</Badge>
						{task.workstream ? (
							<Badge variant="secondary">{task.workstream}</Badge>
						) : null}
						{task.priority ? (
							<Badge className="capitalize">{task.priority}</Badge>
						) : null}
					</div>
				</li>
			))}
		</ul>
	);
}

import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { subtasksProgress } from "#/lib/roadmap/subtasks";
import type { SeedTask } from "#/lib/seed/schemas";

interface RoadmapScopeTaskListProps {
	versionId: string;
	tasks: SeedTask[];
	emptyLabel?: string;
}

export function RoadmapScopeTaskList({
	versionId,
	tasks,
	emptyLabel = "No tasks in this scope.",
}: RoadmapScopeTaskListProps) {
	if (tasks.length === 0) {
		return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
	}

	return (
		<ul className="grid gap-3">
			{tasks.map((task) => {
				const subtaskStats = subtasksProgress(
					task.subtasks.map((step, index) => ({
						id: `${task.id}-step-${index}`,
						text: step.text,
						done: step.done,
					})),
				);
				return (
					<li key={task.id}>
						<Card className="kanban-card">
							<CardHeader className="gap-2 pb-2">
								<div className="flex flex-wrap items-start justify-between gap-2">
									<CardTitle className="text-base font-semibold">{task.title}</CardTitle>
									<div className="flex flex-wrap gap-1.5">
										<Badge variant="secondary">{task.statusColumn}</Badge>
										<Badge variant="outline">{task.priority}</Badge>
										{subtaskStats.total > 0 ? (
											<Badge variant="outline">
												{subtaskStats.done}/{subtaskStats.total} steps
											</Badge>
										) : null}
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex flex-wrap items-center gap-3 pt-0 text-sm">
								{task.workstream ? (
									<span className="text-muted-foreground">
										Workstream:{" "}
										<Link
											to="/versions/$version/workstreams/$slug"
											params={{ version: versionId, slug: task.workstream }}
											className="text-primary hover:underline"
										>
											{task.workstream}
										</Link>
									</span>
								) : null}
								{task.source.url ? (
									<a
										href={task.source.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary inline-flex items-center gap-1 hover:underline"
									>
										Provenance
										<ExternalLink className="size-3.5" />
									</a>
								) : null}
								<Link
									{...(task.workstream
										? {
												to: "/v/$version/w/$workstream" as const,
												params: {
													version: versionId,
													workstream: task.workstream,
												},
												search: { q: task.id },
											}
										: {
												to: "/v/$version" as const,
												params: { version: versionId },
												search: { q: task.id },
											})}
									className="text-primary ml-auto hover:underline"
								>
									Open on board →
								</Link>
							</CardContent>
						</Card>
					</li>
				);
			})}
		</ul>
	);
}

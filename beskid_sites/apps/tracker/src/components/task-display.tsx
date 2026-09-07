import type { RoadmapTask } from "#/lib/github/types";
import {
	selectTaskProperties,
	type TaskDisplayConfig,
	taskStatusClassName,
} from "#/lib/roadmap/task-display";

export interface TaskDisplayProps {
	task: RoadmapTask;
	config?: TaskDisplayConfig;
	variant: "card" | "preview";
}

export function TaskDisplay({ task, config, variant }: TaskDisplayProps) {
	const properties = selectTaskProperties(task, config);

	return (
		<div
			className={
				variant === "preview" ? "flex flex-col gap-3" : "flex flex-col gap-2"
			}
		>
			<div className="flex items-start gap-2">
				<span className="text-muted-foreground shrink-0 font-mono text-xs">
					#{task.number}
				</span>
				<span className="text-sm leading-snug font-semibold">{task.title}</span>
			</div>
			<div className="flex flex-wrap gap-1.5">
				<span
					className={`rounded-md px-2 py-0.5 text-xs font-medium ${taskStatusClassName(task.statusColumn)}`}
				>
					{task.statusColumn}
				</span>
				{properties.map(([property, value]) => (
					<span
						key={property}
						className="rounded-md border border-border px-2 py-0.5 text-xs font-normal"
					>
						{value}
					</span>
				))}
			</div>
		</div>
	);
}

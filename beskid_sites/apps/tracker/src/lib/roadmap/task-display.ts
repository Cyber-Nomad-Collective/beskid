import type { RoadmapTask } from "#/lib/github/types";

export const TASK_DISPLAY_PROPERTIES = [
	"priority",
	"workstream",
	"status",
	"owner",
	"specApproval",
] as const;

export type TaskDisplayProperty = (typeof TASK_DISPLAY_PROPERTIES)[number];
export type TaskDisplayConfig = {
	properties?: readonly TaskDisplayProperty[];
};

export type TaskDisplayPropertyValue = readonly [TaskDisplayProperty, string];

const priorityLabel = {
	high: "High",
	medium: "Medium",
	low: "Low",
} as const;

export function selectTaskProperties(
	task: RoadmapTask,
	config: TaskDisplayConfig = {},
): TaskDisplayPropertyValue[] {
	const values: Record<TaskDisplayProperty, string | undefined> = {
		priority: priorityLabel[task.priority],
		workstream: task.workstream,
		status: task.statusColumn,
		owner: task.owner,
		specApproval: task.specApproval === "pending" ? "Spec pending" : undefined,
	};

	return (config.properties ?? TASK_DISPLAY_PROPERTIES).flatMap((property) => {
		const value = values[property];
		return value ? [[property, value] as const] : [];
	});
}

export function taskStatusClassName(
	status: RoadmapTask["statusColumn"],
): string {
	if (status === "Done") return "bg-emerald-600 text-white";
	if (status === "In Progress") return "bg-sky-600 text-white";
	return "bg-slate-600 text-white";
}

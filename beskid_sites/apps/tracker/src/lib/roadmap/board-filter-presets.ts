export interface BoardFilterPreset {
	id: string;
	label: string;
	query: string;
}

/** One-click filters for the kanban board side panel. */
export const BOARD_FILTER_PRESETS: BoardFilterPreset[] = [
	{ id: "in-progress", label: "In progress", query: 'status:"In Progress"' },
	{ id: "backlog", label: "Backlog", query: "status:backlog" },
	{ id: "done", label: "Done", query: "status:done" },
	{ id: "high-priority", label: "High priority", query: "priority:high" },
	{ id: "medium-priority", label: "Medium priority", query: "priority:medium" },
	{ id: "spec-linked", label: "Spec linked", query: "spec:linked" },
	{ id: "no-spec", label: "No spec link", query: "spec:none" },
];

export function isPresetActive(
	preset: BoardFilterPreset,
	query: string,
): boolean {
	return query.trim() === preset.query.trim();
}

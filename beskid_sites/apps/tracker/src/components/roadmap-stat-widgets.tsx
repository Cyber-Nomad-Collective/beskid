import { Bug, CheckCircle2, GitCommit, ListTodo, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { RoadmapVersionStats } from "#/lib/roadmap/types";

export interface PublicBugStats {
	open: number;
	closed: number;
}

interface RoadmapStatWidgetsProps {
	stats: RoadmapVersionStats;
	bugStats?: PublicBugStats;
	compact?: boolean;
}

const widgets = [
	{
		key: "tasksDone",
		label: "Tasks completed",
		icon: CheckCircle2,
		getValue: (s: RoadmapVersionStats) => s.tasksDone,
		sub: (s: RoadmapVersionStats) => `of ${s.tasksTotal} tracked`,
	},
	{
		key: "commits",
		label: "Commits tracked",
		icon: GitCommit,
		getValue: (s: RoadmapVersionStats) => s.commitsTracked,
		sub: () => "from catalog provenance",
	},
	{
		key: "deliverables",
		label: "Deliverables completed",
		icon: Target,
		getValue: (s: RoadmapVersionStats) => s.deliverablesClosed,
		sub: (s: RoadmapVersionStats) => `of ${s.deliverablesTotal}`,
	},
	{
		key: "inProgress",
		label: "In progress",
		icon: ListTodo,
		getValue: (s: RoadmapVersionStats) => s.tasksInProgress,
		sub: (s: RoadmapVersionStats) => `${s.tasksBacklog} in backlog`,
	},
] as const;

export function RoadmapStatWidgets({
	stats,
	bugStats,
	compact,
}: RoadmapStatWidgetsProps) {
	const items = bugStats
		? [
				...widgets,
				{
					key: "bugs",
					label: "Bugs resolved",
					icon: Bug,
					getValue: () => bugStats.closed,
					sub: () => `${bugStats.open} open on GitHub`,
				},
			]
		: widgets;

	return (
		<div
			className={
				compact
					? "dashboard-widget-grid dashboard-widget-grid--compact"
					: "dashboard-widget-grid"
			}
		>
			{items.map((w) => (
				<Card key={w.key} className="dashboard-widget dashboard-widget--stat">
					<CardHeader className="dashboard-widget__header">
						<w.icon className="dashboard-widget__icon size-4" aria-hidden />
						<CardTitle className="dashboard-widget__title">{w.label}</CardTitle>
					</CardHeader>
					<CardContent className="dashboard-widget__body">
						<p className="dashboard-widget__value">{w.getValue(stats)}</p>
						<p className="dashboard-widget__sub">{w.sub(stats)}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

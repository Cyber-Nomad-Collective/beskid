import { createFileRoute } from "@tanstack/react-router";

import { getIssuesDatabase } from "#/lib/storage/db";
import {
	getTrackerTask,
	listTrackerTasks,
} from "#/lib/tracker/repositories/tasks-repository";

function resolveLink(target: string) {
	const db = getIssuesDatabase();
	const taskMatch = /^(?:task:)?(v\d+\.\d+):([a-z0-9-]+)$/.exec(target);
	if (taskMatch) {
		const task = getTrackerTask(taskMatch[1], taskMatch[2], db);
		return task
			? {
					kind: "tracker-task",
					versionId: task.versionId,
					taskId: task.id,
					href: `/versions/${task.versionId}/tasks/${task.id}`,
				}
			: null;
	}

	const relation = listTrackerTasks(undefined, db)
		.flatMap((task) => task.specRelations)
		.find(
			(entry) =>
				entry.standardId === target || `openspec:${entry.standardId}` === target,
		);
	return relation?.standardId
		? {
				kind: "openspec",
				standardId: relation.standardId,
				catalogRevision: relation.catalogRevision,
				href: relation.href ?? relation.path,
			}
		: null;
}

export const Route = createFileRoute("/api/v1/links/$target")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const link = resolveLink(params.target);
				return link
					? Response.json(link, {
							headers: { "Cache-Control": "public, max-age=300" },
						})
					: Response.json({ error: "Unknown link target" }, { status: 404 });
			},
		},
	},
});

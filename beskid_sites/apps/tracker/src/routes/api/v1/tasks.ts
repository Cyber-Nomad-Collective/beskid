import { createFileRoute } from "@tanstack/react-router";

import { getIssuesDatabase } from "#/lib/storage/db";
import { assertTrackerSpecLink } from "#/lib/tracker/delivery-contract";
import { listTrackerTasks } from "#/lib/tracker/repositories/tasks-repository";
import { listTrackerVersions } from "#/lib/tracker/repositories/versions-repository";
import { createRoadmapTask } from "#/lib/tracker/task-service";
import type { TrackerTask } from "#/lib/tracker/types";

function hasText(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function filterTasksBySpecLink(
	tasks: TrackerTask[],
	standardId: string,
	catalogRevision: string,
): TrackerTask[] {
	return tasks.filter((task) =>
		task.specRelations.some(
			(relation) =>
				relation.standardId === standardId &&
				(relation.catalogRevision == null ||
					relation.catalogRevision === catalogRevision),
		),
	);
}

export function publicTaskView(task: TrackerTask) {
	return {
		id: task.id,
		title: task.title,
		status: task.statusColumn,
		versionId: task.versionId,
		specRelations: task.specRelations.map((relation) => ({
			standardId: relation.standardId,
			catalogRevision: relation.catalogRevision,
			relation: relation.relation,
		})),
	};
}

export const Route = createFileRoute("/api/v1/tasks")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const standardId = url.searchParams.get("standardId") ?? "";
				const catalogRevision = url.searchParams.get("catalogRevision") ?? "";
				try {
					assertTrackerSpecLink({ standardId, catalogRevision });
				} catch (error) {
					return Response.json(
						{
							error: error instanceof Error ? error.message : "Invalid link",
						},
						{ status: 400 },
					);
				}
				const db = getIssuesDatabase();
				const matched = filterTasksBySpecLink(
					listTrackerTasks(undefined, db),
					standardId,
					catalogRevision,
				).map(publicTaskView);
				return Response.json(matched, {
					headers: { "Cache-Control": "public, max-age=60" },
				});
			},
			POST: async ({ request }) => {
				let body: {
					standardId?: string;
					catalogRevision?: string;
					title?: string;
					description?: string;
				};
				try {
					body = (await request.json()) as typeof body;
				} catch {
					return Response.json({ error: "Invalid JSON" }, { status: 400 });
				}
				if (
					!hasText(body.standardId) ||
					!hasText(body.catalogRevision) ||
					!hasText(body.title)
				) {
					return Response.json(
						{
							error: "standardId, catalogRevision, and title are required",
						},
						{ status: 400 },
					);
				}
				try {
					assertTrackerSpecLink({
						standardId: body.standardId,
						catalogRevision: body.catalogRevision,
					});
				} catch (error) {
					return Response.json(
						{
							error: error instanceof Error ? error.message : "Invalid link",
						},
						{ status: 400 },
					);
				}

				const db = getIssuesDatabase();
				const versions = listTrackerVersions(db);
				const version =
					versions.find((entry) => entry.catalogRevision === body.catalogRevision) ??
					versions
						.filter(
							(entry) => entry.status === "Released" && entry.visibility === "public",
						)
						.sort((a, b) => b.sortKey - a.sortKey)[0] ??
					versions[0];
				if (!version) {
					return Response.json(
						{ error: "No tracker version available for task creation" },
						{ status: 503 },
					);
				}

				const path = `openspec/specs/${body.standardId}/spec.md`;
				const created = await createRoadmapTask(
					{
						title: body.title.trim(),
						body: body.description?.trim() ?? "",
						priority: "medium",
						statusColumn: "Backlog",
						version: version.id,
						specRelations: [
							{
								standardId: body.standardId.trim(),
								path,
								href: `https://spec.beskid-lang.org/platform-spec/capabilities/${body.standardId.trim()}/`,
								relation: "tracks",
								required: false,
							},
						],
					},
					db,
				);

				const task = listTrackerTasks(version.id, db).find(
					(entry) => entry.id === created.id,
				);
				if (!task) {
					return Response.json(
						{ error: "Failed to create tracker task" },
						{ status: 500 },
					);
				}

				// Persist catalog revision on the relation row when the seed path omitted it.
				db.run(
					`
					UPDATE tracker_task_spec_relations
					SET catalog_revision = ?
					WHERE version_id = ? AND task_id = ? AND standard_id = ?
					`,
					[body.catalogRevision.trim(), version.id, task.id, body.standardId.trim()],
				);

				const refreshed = listTrackerTasks(version.id, db).find(
					(entry) => entry.id === task.id,
				);
				return Response.json(publicTaskView(refreshed ?? task), {
					status: 201,
				});
			},
		},
	},
});

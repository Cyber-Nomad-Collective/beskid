import { describe, expect, it } from "vitest";
import type { TrackerTask } from "#/lib/tracker/types";
import { filterTasksBySpecLink, publicTaskView } from "./tasks";

function task(
	partial: Partial<TrackerTask> & Pick<TrackerTask, "id">,
): TrackerTask {
	return {
		versionId: "v0.5",
		title: partial.title ?? partial.id,
		statusColumn: "Backlog",
		priority: "medium",
		body: "",
		source: { repo: "beskid", commit: "0000000", subject: "t" },
		subtasks: [],
		specRelations: partial.specRelations ?? [],
		localUpdatedAt: "2026-07-23T00:00:00.000Z",
		createdAt: "2026-07-23T00:00:00.000Z",
		updatedAt: "2026-07-23T00:00:00.000Z",
		...partial,
	};
}

describe("api/v1/tasks helpers", () => {
	it("filters by standardId and catalogRevision", () => {
		const matched = filterTasksBySpecLink(
			[
				task({
					id: "one",
					specRelations: [
						{
							id: 1,
							sortOrder: 0,
							standardId: "language--syntax--blocks",
							catalogRevision: "rev-a",
							path: "openspec/specs/language--syntax--blocks/spec.md",
							relation: "tracks",
							required: false,
						},
					],
				}),
				task({
					id: "two",
					specRelations: [
						{
							id: 1,
							sortOrder: 0,
							standardId: "language--syntax--blocks",
							catalogRevision: "rev-b",
							path: "openspec/specs/language--syntax--blocks/spec.md",
							relation: "tracks",
							required: false,
						},
					],
				}),
			],
			"language--syntax--blocks",
			"rev-a",
		);
		expect(matched.map((entry) => entry.id)).toEqual(["one"]);
	});

	it("projects a public task view", () => {
		expect(
			publicTaskView(
				task({
					id: "one",
					title: "Wire blocks",
					specRelations: [
						{
							id: 1,
							sortOrder: 0,
							standardId: "language--syntax--blocks",
							catalogRevision: "rev-a",
							path: "x",
							relation: "tracks",
							required: false,
						},
					],
				}),
			),
		).toMatchObject({
			id: "one",
			title: "Wire blocks",
			status: "Backlog",
			versionId: "v0.5",
		});
	});
});

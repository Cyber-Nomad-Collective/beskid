import { describe, expect, it } from "vitest";

import { createTrackerTask, listTrackerTasks } from "./tasks";

const trackerBaseUrl = "https://tracker.example.test";

describe("Tracker task embeds", () => {
	it("uses stable OpenSpec identifiers and catalog revisions for task queries", async () => {
		let requested = "";
		await listTrackerTasks(
			{
				standardId: "language--syntax--blocks#BSP-REQ-BLOCK",
				catalogRevision: "catalog-5",
			},
			async (input) => {
				requested = input.toString();
				return Response.json([{ id: "task-1" }]);
			},
			trackerBaseUrl,
		);
		expect(requested).toContain(
			"standardId=language--syntax--blocks%23BSP-REQ-BLOCK",
		);
		expect(requested).toContain("catalogRevision=catalog-5");
	});

	it("forwards stable OpenSpec identifiers and revisions when creating a task", async () => {
		let body = "";
		await createTrackerTask(
			{
				standardId: "language--syntax--blocks#BSP-REQ-BLOCK",
				catalogRevision: "catalog-5",
				title: "Implement block parser",
			},
			async (_input, init) => {
				body = String(init?.body);
				return Response.json({ id: "task-1" }, { status: 201 });
			},
			trackerBaseUrl,
		);
		expect(JSON.parse(body)).toMatchObject({
			standardId: "language--syntax--blocks#BSP-REQ-BLOCK",
			catalogRevision: "catalog-5",
		});
	});

	it("rejects malformed task links with a validation error", async () => {
		await expect(
			listTrackerTasks(
				{ standardId: null, catalogRevision: "catalog-5" } as unknown as {
					standardId: string;
					catalogRevision: string;
				},
				fetch,
				trackerBaseUrl,
			),
		).rejects.toThrow(
			"OpenSpec task links require standardId and catalogRevision",
		);
	});

	it("rejects malformed task titles with a validation error", async () => {
		await expect(
			createTrackerTask(
				{
					standardId: "language--syntax--blocks#BSP-REQ-BLOCK",
					catalogRevision: "catalog-5",
					title: null,
				} as unknown as {
					standardId: string;
					catalogRevision: string;
					title: string;
				},
				fetch,
				trackerBaseUrl,
			),
		).rejects.toThrow("Tracker task title is required");
	});
});

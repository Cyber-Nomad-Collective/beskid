import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TaskDisplay } from "#/components/task-display";
import type { RoadmapTask } from "#/lib/github/types";

const task: RoadmapTask = {
	id: "parser",
	number: 12,
	title: "Finish parser",
	owner: "compiler-team",
	priority: "high",
	statusColumn: "In Progress",
	body: "Implement the parser.",
	specRelations: [],
	subtasks: [],
	specApproval: "pending",
	version: "v0.5",
	workstream: "compiler",
	htmlUrl: "https://tracker.test/parser",
	labelNames: [],
};

describe("TaskDisplay", () => {
	it("renders configured properties in the same order for cards and previews", () => {
		const config = { properties: ["priority", "workstream"] as const };
		const card = renderToStaticMarkup(
			<TaskDisplay task={task} config={config} variant="card" />,
		);
		const preview = renderToStaticMarkup(
			<TaskDisplay task={task} config={config} variant="preview" />,
		);

		for (const markup of [card, preview]) {
			expect(markup.indexOf("High")).toBeLessThan(markup.indexOf("compiler"));
			expect(markup).toContain("In Progress");
		}
	});
});

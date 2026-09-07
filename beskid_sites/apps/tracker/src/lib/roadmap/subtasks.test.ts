import { describe, expect, it } from "vitest";

import {
	parseSubtasksBlock,
	stripSubtasksFromBody,
	upsertSubtasksInBody,
} from "#/lib/roadmap/subtasks";

describe("roadmap subtasks", () => {
	it("round-trips fence and GitHub task list", () => {
		const items = [
			{ id: "a", text: "First", done: true },
			{ id: "b", text: "Second", done: false },
		];
		const body = upsertSubtasksInBody("## Context\n\nDetails.", items);

		expect(body).toContain("### Subtasks");
		expect(body).toContain("- [x] First");
		expect(body).toContain("- [ ] Second");
		expect(body).toContain("```roadmap-subtasks");

		const parsed = parseSubtasksBlock(body);
		expect(parsed.items).toHaveLength(2);
		expect(parsed.items[0]?.text).toBe("First");
		expect(parsed.items[0]?.done).toBe(true);
	});

	it("strips subtasks from editable description", () => {
		const body = upsertSubtasksInBody("Prose only.", [
			{ id: "1", text: "Do thing", done: false },
		]);
		expect(stripSubtasksFromBody(body)).toBe("Prose only.");
	});

	it("parses native GitHub checklist when fence is absent", () => {
		const body = `### Subtasks

- [x] Ship API
- [ ] Add tests`;

		const parsed = parseSubtasksBlock(body);
		expect(parsed.items.map((item) => item.text)).toEqual([
			"Ship API",
			"Add tests",
		]);
		expect(parsed.items[0]?.done).toBe(true);
		expect(parsed.items[1]?.done).toBe(false);
	});
});

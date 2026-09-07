import { describe, expect, it } from "vitest";

import {
	parseStepsValue,
	serializeStepsValue,
	stepsToMarkdown,
} from "#/lib/report-issue/field-values";

describe("steps field values", () => {
	it("round-trips row objects including empty trailing step", () => {
		const rows = [
			{ id: "a", text: "First" },
			{ id: "b", text: "" },
		];
		const raw = serializeStepsValue(rows);
		expect(parseStepsValue(raw)).toEqual(rows);
	});

	it("parses legacy string array", () => {
		expect(parseStepsValue(JSON.stringify(["a", "b"]))).toEqual([
			expect.objectContaining({ text: "a" }),
			expect.objectContaining({ text: "b" }),
		]);
	});

	it("parses legacy numbered plain text", () => {
		const rows = parseStepsValue("1. First\n2. Second");
		expect(rows.map((r) => r.text)).toEqual(["First", "Second"]);
	});

	it("formats markdown list", () => {
		expect(
			stepsToMarkdown([
				{ id: "1", text: "Alpha" },
				{ id: "2", text: "Beta" },
			]),
		).toBe("1. Alpha\n2. Beta");
	});
});

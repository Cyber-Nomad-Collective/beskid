import { describe, expect, it } from "vitest";
import type { ReportAttachmentDraft } from "#/lib/report-issue/field-values";
import {
	type StepRow,
	serializeStepsValue,
} from "#/lib/report-issue/field-values";
import {
	buildReportBody,
	collectReportFields,
	reportField,
	reportGroup,
	reportSection,
} from "#/lib/report-issue/fields";

describe("report form layout", () => {
	it("collects fields from nested groups and sections", () => {
		const layout = [
			reportSection("s", "Section", [
				reportField({
					id: "title",
					kind: "title",
					label: "Title",
					required: true,
				}),
				reportGroup("pair", "horizontal", [
					reportField({ id: "a", kind: "text", label: "A" }),
					reportField({ id: "b", kind: "text", label: "B" }),
				]),
			]),
		];

		expect(collectReportFields(layout).map((f) => f.id)).toEqual([
			"title",
			"a",
			"b",
		]);
	});

	it("builds markdown body from grouped fields", () => {
		const layout = [
			reportField({ id: "title", kind: "title", label: "Title" }),
			reportGroup("g", "vertical", [
				reportField({ id: "note", kind: "text", label: "Note" }),
			]),
		];

		expect(buildReportBody(layout, { note: "hello" })).toBe("### Note\n\nhello");
	});

	it("serializes reproduction steps into numbered markdown", () => {
		const layout = [
			reportField({ id: "steps", kind: "steps", label: "Steps to reproduce" }),
		];

		const stepsJson = serializeStepsValue([
			{ id: "1", text: "Open CLI" },
			{ id: "2", text: "Run build" },
		] satisfies StepRow[]);
		expect(buildReportBody(layout, { steps: stepsJson })).toBe(
			"### Steps to reproduce\n\n1. Open CLI\n2. Run build",
		);
	});

	it("lists attachment filenames in the body", () => {
		const layout = [
			reportField({ id: "attachments", kind: "attachments", label: "Files" }),
		];
		const drafts: ReportAttachmentDraft[] = [
			{
				id: "1",
				file: new File(["x"], "log.txt", { type: "text/plain" }),
			},
		];

		expect(buildReportBody(layout, {}, { attachments: drafts })).toContain(
			"### Attachments",
		);
		expect(buildReportBody(layout, {}, { attachments: drafts })).toContain(
			"log.txt",
		);
	});
});

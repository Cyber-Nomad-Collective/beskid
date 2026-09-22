import { describe, expect, it } from "vitest";
import type { LearnExercise } from "#/data/learningCatalog";
import { getLessonSteps, validateSourceStep } from "./steps";

describe("validateSourceStep", () => {
	it("passes when the required source fragment is present", () => {
		expect(
			validateSourceStep(
				{
					id: "return",
					title: "Return a value",
					body: "",
					check: { kind: "source", expectedText: "return 0;" },
				},
				"i32 Main() {\n  return 0;\n}",
			),
		).toEqual({ ok: true, message: "Step complete." });
	});

	it("fails with an actionable message when source is missing", () => {
		expect(
			validateSourceStep(
				{
					id: "return",
					title: "Return a value",
					body: "",
					check: { kind: "source", expectedText: "return 0;" },
				},
				"i32 Main() {\n}",
			),
		).toEqual({ ok: false, message: "Add `return 0;` to continue." });
	});

	it("does not gate steps without a source check", () => {
		expect(
			validateSourceStep({ id: "read", title: "Read", body: "" }, ""),
		).toEqual({
			ok: true,
			message: "Step complete.",
		});
	});

	it("uses a retrieval step instead of a compiler command for reference-only lessons", () => {
		const lesson = {
			id: "reference_lesson",
			title: "Reference lesson",
			objective: "Read a source-backed concept.",
			slug: "reference-lesson",
			starterCode: "i32 Main() { return 0; }",
			command: "reference",
			mode: "reference-only",
			status: "reference-only",
			hints: [],
			lessonPath: "/site/learn/curriculum/reference/lesson.md",
			difficulty: "beginner",
			questions: [],
			detailedContent: "## Hook and goal",
			prerequisites: [],
			category: "advanced-language",
		} satisfies LearnExercise;

		const [step] = getLessonSteps(lesson);
		expect(step).toMatchObject({ id: "read-and-retrieve" });
		expect(step?.check).toBeUndefined();
	});
});

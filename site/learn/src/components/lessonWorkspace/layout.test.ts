import { describe, expect, it } from "vitest";
import type { LearnExercise } from "#/data/learningCatalog";

import { buildLessonTileLayout, getLessonTileIds } from "./layout";

const interactiveLesson = {
	id: "interactive_fixture",
	title: "Interactive fixture",
	objective: "Check a compiler-backed lesson.",
	slug: "interactive-fixture",
	starterCode: "i32 Main() { return 0; }",
	command: "analyze",
	mode: "interactive",
	status: "available",
	hints: [],
	lessonPath: "/site/learn/curriculum/fixture/lesson.md",
	difficulty: "beginner",
	questions: [],
	detailedContent: "## Hook and goal",
	prerequisites: [],
	category: "foundations",
} satisfies LearnExercise;

const referenceLesson = {
	...interactiveLesson,
	id: "reference_fixture",
	command: "reference",
	mode: "reference-only",
	status: "reference-only",
} satisfies LearnExercise;

describe("immutable lesson tile layouts", () => {
	it("derives the visible tile set from the lesson instead of user state", () => {
		expect(getLessonTileIds(interactiveLesson)).toEqual([
			"editor",
			"terminal",
			"content",
		]);
	});

	it("builds a deterministic mosaic for each lesson declaration", () => {
		expect(buildLessonTileLayout(interactiveLesson)).toMatchObject({
			kind: "split",
		});
	});

	it("removes the terminal from reference-only lesson layouts", () => {
		expect(getLessonTileIds(referenceLesson)).toEqual([
			"editor",
			"content",
			"hints",
			"questions",
		]);
	});
});

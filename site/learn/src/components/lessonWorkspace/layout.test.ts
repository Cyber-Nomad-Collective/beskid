import { describe, expect, it } from "vitest";
import { learnExercises } from "#/data/learningCatalog";

import { buildLessonTileLayout, getLessonTileIds } from "./layout";

const helloLesson = learnExercises[0]!;

describe("immutable lesson tile layouts", () => {
	it("derives the visible tile set from the lesson instead of user state", () => {
		expect(getLessonTileIds(helloLesson)).toEqual(["editor", "terminal", "content"]);
	});

	it("builds a deterministic mosaic for each lesson declaration", () => {
		expect(buildLessonTileLayout(helloLesson)).toMatchObject({ kind: "split" });
	});
});

import type { LessonStep } from "#/components/lessonWorkspace/steps";
import { generatedLearnExercises } from "./generatedLearningCatalog";

export type Question = { id: string; text: string; options: string[]; correctIndex: number };
export type LearnExerciseCategory =
	| "orientation"
	| "foundations"
	| "control-flow"
	| "data-modeling"
	| "program-structure"
	| "reliability-and-abstraction"
	| "functions-with-context"
	| "fibers-and-channels"
	| "core-library"
	| "advanced-language";
export interface TileLayoutEntry { id: string; label: string; defaultVisible: boolean; defaultSize: number; }

// This UI/server contract is deliberately stable. Curriculum authors write
// Markdown; scripts/build-curriculum.mjs produces this shape from it.
export type LearnExercise = {
	id: string;
	title: string;
	objective: string;
	slug: string;
	starterCode: string;
	command: string;
	mode: "interactive" | "reference-only";
	expectedOutput?: string;
	hints: Array<string>;
	lessonPath: string;
	difficulty: "beginner" | "intermediate";
	questions: ReadonlyArray<Question>;
	detailedContent: string;
	prerequisites: ReadonlyArray<string>;
	category: LearnExerciseCategory;
	tileLayout?: ReadonlyArray<TileLayoutEntry>;
	steps?: ReadonlyArray<LessonStep>;
	layout?: { visibleTiles: ReadonlyArray<"editor" | "terminal" | "content" | "hints" | "questions" | "fileExplorer"> };
};

export type LearnProgress = { exerciseId: string; completed: boolean; score: number; completedAt?: string };

export const learnExercises: ReadonlyArray<LearnExercise> = generatedLearnExercises;
export const exerciseCount = learnExercises.length;

export function validateModeForExercise(exercise: LearnExercise): string {
	if (exercise.mode === "reference-only") return "reference";
	return exercise.command === "run" ? "runtime" : "compiler";
}

export const lessonGroups: Record<LearnExerciseCategory, LearnExercise[]> = {
	orientation: [],
	foundations: [],
	"control-flow": [],
	"data-modeling": [],
	"program-structure": [],
	"reliability-and-abstraction": [],
	"functions-with-context": [],
	"fibers-and-channels": [],
	"core-library": [],
	"advanced-language": [],
};
for (const exercise of learnExercises) (lessonGroups[exercise.category] ??= []).push(exercise);

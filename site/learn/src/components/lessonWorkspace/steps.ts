import type { LearnExercise } from "#/data/learningCatalog";

export type LessonFocus = {
	startLine: number;
	endLine: number;
	startColumn?: number;
	endColumn?: number;
};

export type LessonCheck =
	| { kind: "source"; expectedText: string }
	| { kind: "command"; command: string };

export type LessonStep = {
	id: string;
	title: string;
	body: string;
	focus?: LessonFocus;
	check?: LessonCheck;
	hint?: string;
};

export type LessonStepStatus = "locked" | "current" | "passed" | "failed";

export function validateSourceStep(step: LessonStep, code: string): { ok: boolean; message: string } {
	if (!step.check || step.check.kind !== "source") {
		return { ok: true, message: "Step complete." };
	}
	const expected = step.check.expectedText;
	if (code.includes(expected)) return { ok: true, message: "Step complete." };
	return { ok: false, message: `Add \`${expected}\` to continue.` };
}

export function getLessonSteps(exercise: LearnExercise): LessonStep[] {
	if (exercise.steps?.length) return [...exercise.steps];
	return [
		{
			id: "understand",
			title: "Understand the shape",
			body: exercise.objective,
			focus: { startLine: 1, endLine: Math.min(3, exercise.starterCode.split("\n").length) },
		},
		{
			id: "check",
			title: "Check your program",
			body: `Run \`beskid ${exercise.command}\` to validate this lesson.`,
			check: { kind: "command", command: exercise.command },
		},
	];
}

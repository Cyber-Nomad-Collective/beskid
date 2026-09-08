import type * as monacoEditor from "monaco-editor";

export const playgroundCompletionItems = [
	{
		label: "use Core.Output",
		insertText: "use Core.Output;",
		detail: "Import output helpers",
		documentation: "Makes Core.Output available in this file.",
	},
	{
		label: "unit Run",
		insertText: "unit Run() {\n\t$0\n}",
		detail: "Beskid program entry point",
		documentation: "The unit-returning entry point for a small executable.",
	},
	{
		label: "i64",
		insertText: "i64",
		detail: "Signed 64-bit integer",
		documentation: "A signed 64-bit integer type.",
	},
] as const;

export function getPlaygroundCode(
	editor: Pick<monacoEditor.editor.IStandaloneCodeEditor, "getValue"> | null,
	fallback: string,
): string {
	return editor?.getValue() ?? fallback;
}

export function getPlaygroundExercise(exerciseId: string) {
	if (exerciseId !== "playground") return undefined;
	return { id: "playground", command: "analyze" } as const;
}

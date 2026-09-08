import type * as monacoEditor from "monaco-editor";

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

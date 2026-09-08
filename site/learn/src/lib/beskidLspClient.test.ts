import { describe, expect, it } from "vitest";

import {
	toMonacoCompletionItems,
	toMonacoDiagnosticMarkers,
} from "./beskidLspClient";

describe("compiler completion mapping", () => {
	it("preserves compiler-provided completion labels and text edits", () => {
		const result = toMonacoCompletionItems(
			[
				{
					label: "WriteLine",
					kind: 2,
					detail: "unit WriteLine(string value)",
					textEdit: {
						newText: "WriteLine",
						range: {
							start: { line: 2, character: 4 },
							end: { line: 2, character: 7 },
						},
					},
				},
			],
			{ lineNumber: 3, column: 8 },
		);

		expect(result).toEqual([
			expect.objectContaining({
				label: "WriteLine",
				insertText: "WriteLine",
				detail: "unit WriteLine(string value)",
				range: {
					startLineNumber: 3,
					startColumn: 5,
					endLineNumber: 3,
					endColumn: 8,
				},
			}),
		]);
	});
});

describe("compiler diagnostics mapping", () => {
	it("converts zero-based LSP ranges into one-based Monaco markers", () => {
		expect(
			toMonacoDiagnosticMarkers([
				{
					message: "expected expression",
					severity: 1,
					range: {
						start: { line: 0, character: 2 },
						end: { line: 0, character: 7 },
					},
				},
			]),
		).toEqual([
			{
				message: "expected expression",
				severity: 8,
				startLineNumber: 1,
				startColumn: 3,
				endLineNumber: 1,
				endColumn: 8,
			},
		]);
	});
});

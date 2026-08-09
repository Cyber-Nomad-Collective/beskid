import type { Terminal } from "xterm";

export type CheckResponse = {
	exerciseId: string;
	command: string;
	exitCode: number;
	success: boolean;
	stdout: string;
	stderr: string;
	timedOut: boolean;
	durationMs: number;
	diagnosticsSummary: string;
	expectedOutputMatched?: boolean;
	expectedOutput?: string;
	error?: string;
};

export function writeBlock(terminal: Terminal, lines: readonly string[]): void {
	for (const line of lines) {
		terminal.writeln(line);
	}
}
export function parseMultiline(value: string, label: string): string[] {
	return value
		.split(/\r?\n/)
		.filter((line) => line.trim().length > 0)
		.map((line) => `${label} ${line}`);
}

export function parseCheckResponse(payload: string): CheckResponse {
	const trimmed = payload.trim();
	if (!trimmed) {
		throw new Error("Check endpoint returned an empty response.");
	}

	if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
		throw new Error("Check endpoint returned HTML or plain text instead of JSON.");
	}

	try {
		return JSON.parse(trimmed) as CheckResponse;
	} catch (error) {
		throw new Error(
			error instanceof Error
				? `Invalid JSON from check endpoint: ${error.message}`
				: "Invalid JSON from check endpoint.",
		);
	}
}

/** One row in the reproduction-steps editor (stable id for DnD). */
export interface StepRow {
	id: string;
	text: string;
}

/** Checklist row for tracker-native roadmap subtasks. */
export interface SubtaskRow {
	id: string;
	text: string;
	done: boolean;
}

function newStepId(): string {
	return crypto.randomUUID();
}

function rowsFromStrings(steps: string[]): StepRow[] {
	if (steps.length === 0) return [{ id: newStepId(), text: "" }];
	return steps.map((text) => ({ id: newStepId(), text }));
}

/** Parse form value into editable rows (keeps empty trailing steps). */
export function parseStepsValue(raw: string): StepRow[] {
	if (!raw.trim()) return [{ id: newStepId(), text: "" }];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed) || parsed.length === 0) {
			return [{ id: newStepId(), text: "" }];
		}
		if (
			typeof parsed[0] === "object" &&
			parsed[0] !== null &&
			"id" in parsed[0]
		) {
			return (parsed as StepRow[]).map((row) => ({
				id: String(row.id),
				text: String(row.text ?? ""),
			}));
		}
		return rowsFromStrings((parsed as unknown[]).map((step) => String(step)));
	} catch {
		const lines = raw
			.split("\n")
			.map((line) => line.replace(/^\s*\d+\.\s*/, "").trim());
		if (lines.length === 0) return [{ id: newStepId(), text: "" }];
		return rowsFromStrings(lines);
	}
}

/** Persist editor rows (includes empty steps so Add / Enter can append). */
export function serializeStepsValue(rows: StepRow[]): string {
	return JSON.stringify(
		rows.length > 0 ? rows : [{ id: newStepId(), text: "" }],
	);
}

export function stepsToMarkdown(rows: StepRow[]): string {
	return rows
		.map((row) => row.text.trim())
		.filter(Boolean)
		.map((step, index) => `${index + 1}. ${step}`)
		.join("\n");
}

function newSubtaskId(): string {
	return crypto.randomUUID();
}

function emptySubtaskRow(): SubtaskRow {
	return { id: newSubtaskId(), text: "", done: false };
}

/** Parse a tracker subtask editor value. Legacy markdown rows remain readable. */
export function parseSubtasksValue(raw: string): SubtaskRow[] {
	if (!raw.trim()) return [emptySubtaskRow()];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed) || parsed.length === 0) {
			return [emptySubtaskRow()];
		}
		return (parsed as SubtaskRow[]).map((row) => ({
			id: String(row.id ?? newSubtaskId()),
			text: String(row.text ?? ""),
			done: Boolean(row.done),
		}));
	} catch {
		const lines = raw
			.split("\n")
			.map((line) => line.match(/^- \[([ xX])\]\s+(.*)$/))
			.filter(Boolean) as RegExpMatchArray[];
		if (lines.length === 0) return [emptySubtaskRow()];
		return lines.map((match) => ({
			id: newSubtaskId(),
			text: match[2]?.trim() ?? "",
			done: match[1]?.toLowerCase() === "x",
		}));
	}
}

export function serializeSubtasksValue(rows: SubtaskRow[]): string {
	return JSON.stringify(rows.length > 0 ? rows : [emptySubtaskRow()]);
}

/** Legacy markdown checklist serializer retained for historical task bodies. */
export function subtasksToMarkdown(rows: SubtaskRow[]): string {
	return rows
		.filter((row) => row.text.trim())
		.map((row) => `- [${row.done ? "x" : " "}] ${row.text.trim()}`)
		.join("\n");
}

export interface ReportAttachmentDraft {
	id: string;
	file: File;
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fileToBase64(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

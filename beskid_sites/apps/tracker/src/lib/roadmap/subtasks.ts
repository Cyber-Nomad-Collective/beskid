import {
	parseSubtasksValue,
	type SubtaskRow,
	serializeSubtasksValue,
	subtasksToMarkdown,
} from "#/lib/report-issue/field-values";

export type { SubtaskRow };

export interface RoadmapSubtasksBlock {
	items: SubtaskRow[];
}

const ROADMAP_SUBTASKS_FENCE = /```roadmap-subtasks\s*\n([\s\S]*?)\n```/;

const SUBTASKS_HEADING = /### Subtasks\s*\n(?:- \[[ xX]\].*\n?)+/;

/** Parse subtasks from a historical task body (fence first, then markdown list). */
export function parseSubtasksBlock(body: string): RoadmapSubtasksBlock {
	const fenceMatch = body.match(ROADMAP_SUBTASKS_FENCE);
	if (fenceMatch?.[1]) {
		try {
			const parsed = JSON.parse(fenceMatch[1]) as RoadmapSubtasksBlock;
			if (Array.isArray(parsed.items)) {
				return {
					items: parsed.items
						.filter((item) => typeof item?.text === "string")
						.map((item) => ({
							id: String(item.id ?? crypto.randomUUID()),
							text: String(item.text),
							done: Boolean(item.done),
						})),
				};
			}
		} catch {
			/* fall through */
		}
	}

	const sectionMatch = body.match(
		/### Subtasks\s*\n([\s\S]*?)(?:\n### |\n```|$)/,
	);
	if (!sectionMatch?.[1]) {
		return { items: [] };
	}

	const lines = sectionMatch[1]
		.split("\n")
		.map((line) => line.match(/^- \[([ xX])\]\s+(.*)$/))
		.filter(Boolean) as RegExpMatchArray[];

	return {
		items: lines.map((match) => ({
			id: crypto.randomUUID(),
			text: match[2]?.trim() ?? "",
			done: match[1]?.toLowerCase() === "x",
		})),
	};
}

export function serializeSubtasksBlock(items: SubtaskRow[]): string {
	if (items.length === 0) return "";
	const payload: RoadmapSubtasksBlock = { items };
	return `\n\`\`\`roadmap-subtasks\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`;
}

/** Remove subtask markdown section and machine-readable fence from body. */
export function stripSubtasksFromBody(body: string): string {
	return body
		.replace(ROADMAP_SUBTASKS_FENCE, "")
		.replace(SUBTASKS_HEADING, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/** Serialize historical markdown checklist data. New task writes use normalized rows. */
export function upsertSubtasksInBody(
	body: string,
	items: SubtaskRow[],
): string {
	const without = stripSubtasksFromBody(body).trimEnd();
	const nonEmpty = items.filter((item) => item.text.trim().length > 0);
	if (nonEmpty.length === 0) {
		return without;
	}

	const markdown = subtasksToMarkdown(nonEmpty);
	const section = markdown ? `### Subtasks\n\n${markdown}` : "";
	const fence = serializeSubtasksBlock(nonEmpty);
	const parts = [without, section, fence.trim()].filter(Boolean);
	return parts.join("\n\n").trim();
}

export function subtasksProgress(items: SubtaskRow[]): {
	done: number;
	total: number;
} {
	const total = items.filter((item) => item.text.trim()).length;
	const done = items.filter((item) => item.text.trim() && item.done).length;
	return { done, total };
}

export function subtasksFromFormValue(raw: string): SubtaskRow[] {
	return parseSubtasksValue(raw).filter((item) => item.text.trim().length > 0);
}

export function subtasksToFormValue(items: SubtaskRow[]): string {
	if (items.length === 0) {
		return serializeSubtasksValue([
			{ id: crypto.randomUUID(), text: "", done: false },
		]);
	}
	return serializeSubtasksValue(items);
}

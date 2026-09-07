import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import type { RoadmapPriority } from "#/lib/github/types";

const TOKEN_PATTERN = /(\w+):(?:"([^"]+)"|(\S+))/g;

export interface ParsedMetaQuery {
	/** Free-text tokens (title, body, spec paths). */
	text: string;
	workstream?: string;
	domain?: string;
	area?: string;
	feature?: string;
	status?: RoadmapColumnId;
	priority?: RoadmapPriority;
	owner?: string;
	issue?: number;
	/** When true, only tasks with spec relations; false = without. */
	specLinked?: boolean;
}

function normalizeStatus(value: string): RoadmapColumnId | undefined {
	const key = value.toLowerCase().replace(/[-_]/g, " ");
	if (key === "backlog") return "Backlog";
	if (key === "in progress" || key === "progress" || key === "doing") {
		return "In Progress";
	}
	if (key === "done" || key === "closed" || key === "complete") return "Done";
	return undefined;
}

function normalizePriority(value: string): RoadmapPriority | undefined {
	const key = value.toLowerCase();
	if (key === "high" || key === "h") return "high";
	if (key === "medium" || key === "med" || key === "m") return "medium";
	if (key === "low" || key === "l") return "low";
	return undefined;
}

function parseIssueToken(value: string): number | undefined {
	const stripped = value.replace(/^#/, "");
	const num = Number.parseInt(stripped, 10);
	return Number.isFinite(num) && num > 0 ? num : undefined;
}

export function parseMetaQuery(raw: string): ParsedMetaQuery {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { text: "" };
	}

	const textParts: string[] = [];
	const parsed: ParsedMetaQuery = { text: "" };

	let lastIndex = 0;
	for (const match of trimmed.matchAll(TOKEN_PATTERN)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			textParts.push(trimmed.slice(lastIndex, index));
		}
		lastIndex = index + match[0].length;

		const key = match[1]?.toLowerCase();
		const value = (match[2] ?? match[3] ?? "").trim();
		if (!key || !value) continue;

		switch (key) {
			case "workstream":
			case "ws":
				parsed.workstream = value;
				break;
			case "domain":
			case "d":
				parsed.domain = value;
				break;
			case "area":
			case "a":
				parsed.area = value;
				break;
			case "feature":
			case "f":
				parsed.feature = value;
				break;
			case "status":
			case "column":
			case "state": {
				const status = normalizeStatus(value);
				if (status) parsed.status = status;
				break;
			}
			case "priority":
			case "pri":
			case "p": {
				const priority = normalizePriority(value);
				if (priority) parsed.priority = priority;
				break;
			}
			case "owner":
			case "assignee":
			case "user":
				parsed.owner = value.replace(/^@/, "");
				break;
			case "issue":
			case "i":
			case "#": {
				const issue = parseIssueToken(value);
				if (issue) parsed.issue = issue;
				break;
			}
			case "spec":
				parsed.specLinked =
					value === "linked" || value === "yes" || value === "true" || value === "1";
				if (
					value === "none" ||
					value === "no" ||
					value === "false" ||
					value === "0"
				) {
					parsed.specLinked = false;
				}
				break;
			default:
				textParts.push(match[0]);
		}
	}

	if (lastIndex < trimmed.length) {
		textParts.push(trimmed.slice(lastIndex));
	}

	// Bare #123 at start or as word
	const joined = textParts.join(" ").trim();
	const bareIssue = joined.match(/^#(\d+)$/) ?? joined.match(/\b#(\d+)\b/);
	if (bareIssue && !parsed.issue) {
		parsed.issue = Number.parseInt(bareIssue[1]!, 10);
		parsed.text = joined.replace(bareIssue[0], "").trim();
	} else {
		parsed.text = joined;
	}

	return parsed;
}

export function metaQueryIsEmpty(query: ParsedMetaQuery): boolean {
	return (
		!query.text &&
		!query.workstream &&
		!query.domain &&
		!query.area &&
		!query.feature &&
		!query.status &&
		!query.priority &&
		!query.owner &&
		!query.issue &&
		query.specLinked === undefined
	);
}

export function formatMetaQueryHint(): string {
	return "Try workstream:docs-site status:done priority:high #220 spec:linked or free text";
}

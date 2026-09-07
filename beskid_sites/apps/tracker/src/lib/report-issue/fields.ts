import {
	formatFileSize,
	parseStepsValue,
	parseSubtasksValue,
	type ReportAttachmentDraft,
	stepsToMarkdown,
	subtasksToMarkdown,
} from "#/lib/report-issue/field-values";

export type ReportFieldKind =
	| "title"
	| "textarea"
	| "text"
	| "select"
	| "markdown"
	| "steps"
	| "subtasks"
	| "attachments"
	| "spec-parent"
	| "related-topics"
	| "layout-preset";

export type ReportGroupLayout = "vertical" | "horizontal";

export interface ReportFieldOption {
	value: string;
	label: string;
}

/** Leaf input in a report form. */
export interface ReportFieldNode {
	type: "field";
	id: string;
	kind: ReportFieldKind;
	label: string;
	required?: boolean;
	placeholder?: string;
	hint?: string;
	/** Textarea row count (default 3). */
	rows?: number;
	options?: ReportFieldOption[];
	/** Column span inside a horizontal group (default 1). */
	colSpan?: 1 | 2 | 3;
}

export interface ReportGroupOptions {
	bordered?: boolean;
	dense?: boolean;
}

export interface ReportFieldGroupNode {
	type: "group";
	id: string;
	layout: ReportGroupLayout;
	label?: string;
	children: ReportFormNode[];
	bordered?: boolean;
	dense?: boolean;
}

/** Jira-style form section with heading and optional hint. */
export interface ReportSectionNode {
	type: "section";
	id: string;
	title: string;
	description?: string;
	children: ReportFormNode[];
}

export type ReportFormNode =
	| ReportFieldNode
	| ReportFieldGroupNode
	| ReportSectionNode;

export type ReportFormLayout = ReportFormNode[];

/** @deprecated Use `reportField()` nodes inside a layout instead. */
export type ReportFieldConfig = Omit<ReportFieldNode, "type">;

export function reportField(
	config: Omit<ReportFieldNode, "type">,
): ReportFieldNode {
	return { type: "field", ...config };
}

export function reportGroup(
	id: string,
	layout: ReportGroupLayout,
	children: ReportFormNode[],
	label?: string,
	options?: ReportGroupOptions,
): ReportFieldGroupNode {
	return {
		type: "group",
		id,
		layout,
		label,
		children,
		bordered: options?.bordered,
		dense: options?.dense,
	};
}

export function reportSection(
	id: string,
	title: string,
	children: ReportFormNode[],
	description?: string,
): ReportSectionNode {
	return { type: "section", id, title, description, children };
}

export function layoutFromFields(
	fields: ReportFieldConfig[],
): ReportFormLayout {
	return fields.map((field) => reportField(field));
}

export function isReportFieldGroup(
	node: ReportFormNode,
): node is ReportFieldGroupNode {
	return node.type === "group";
}

export function isReportSection(
	node: ReportFormNode,
): node is ReportSectionNode {
	return node.type === "section";
}

export function collectReportFields(
	layout: ReportFormLayout,
): ReportFieldNode[] {
	const fields: ReportFieldNode[] = [];
	const walk = (nodes: ReportFormNode[]) => {
		for (const node of nodes) {
			if (node.type === "field") {
				if (node.kind !== "attachments") {
					fields.push(node);
				}
			} else {
				walk(node.children);
			}
		}
	};
	walk(layout);
	return fields;
}

export function collectAttachmentFieldIds(layout: ReportFormLayout): string[] {
	const ids: string[] = [];
	const walk = (nodes: ReportFormNode[]) => {
		for (const node of nodes) {
			if (node.type === "field" && node.kind === "attachments") {
				ids.push(node.id);
			} else if (node.type !== "field") {
				walk(node.children);
			}
		}
	};
	walk(layout);
	return ids;
}

export function findTitleField(
	layout: ReportFormLayout,
): ReportFieldNode | undefined {
	return collectReportFields(layout).find((f) => f.kind === "title");
}

function formatFieldBody(field: ReportFieldNode, value: string): string | null {
	const trimmed = value.trim();
	if (field.kind === "title" || field.kind === "attachments") {
		return null;
	}

	if (field.kind === "steps") {
		const markdown = stepsToMarkdown(parseStepsValue(value));
		return markdown ? `### ${field.label}\n\n${markdown}` : null;
	}

	if (field.kind === "subtasks") {
		const markdown = subtasksToMarkdown(parseSubtasksValue(value));
		return markdown ? `### ${field.label}\n\n${markdown}` : null;
	}

	if (!trimmed) return null;

	return `### ${field.label}\n\n${trimmed}`;
}

export function buildReportBody(
	layout: ReportFormLayout,
	values: Record<string, string>,
	attachmentsByField: Record<string, ReportAttachmentDraft[]> = {},
): string {
	const parts: string[] = [];

	for (const field of collectReportFields(layout)) {
		const block = formatFieldBody(field, values[field.id] ?? "");
		if (block) parts.push(block);
	}

	for (const fieldId of collectAttachmentFieldIds(layout)) {
		const files = attachmentsByField[fieldId] ?? [];
		if (files.length === 0) continue;
		const lines = files.map(
			(item) => `- ${item.file.name} (${formatFileSize(item.file.size)})`,
		);
		parts.push(`### Attachments\n\n${lines.join("\n")}`);
	}

	return parts.join("\n\n").trim();
}

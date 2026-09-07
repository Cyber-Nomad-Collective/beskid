"use client";

import { AttachmentsField } from "#/components/report-fields/attachments-field";
import { LayoutPresetField } from "#/components/report-fields/layout-preset-field";
import { MarkdownField } from "#/components/report-fields/markdown-field";
import { RelatedTopicsField } from "#/components/report-fields/related-topics-field";
import { ReportFormSection } from "#/components/report-fields/report-field-chrome";
import { SpecParentField } from "#/components/report-fields/spec-parent-field";
import { StepsField } from "#/components/report-fields/steps-field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type { ReportAttachmentDraft } from "#/lib/report-issue/field-values";
import type {
	ReportFieldGroupNode,
	ReportFieldNode,
	ReportFormLayout,
	ReportFormNode,
	ReportSectionNode,
} from "#/lib/report-issue/fields";
import { cn } from "#/lib/utils";

export interface ReportFormLayoutProps {
	layout: ReportFormLayout;
	values: Record<string, string>;
	attachments: Record<string, ReportAttachmentDraft[]>;
	pending?: boolean;
	onValueChange: (id: string, value: string) => void;
	onAttachmentsChange: (fieldId: string, files: ReportAttachmentDraft[]) => void;
}

export function ReportFormLayoutView({
	layout,
	values,
	attachments,
	pending,
	onValueChange,
	onAttachmentsChange,
}: ReportFormLayoutProps) {
	return (
		<div className="work-item-form flex flex-col gap-0">
			{layout.map((node) => (
				<ReportFormNodeView
					key={node.type === "field" ? node.id : node.id}
					node={node}
					values={values}
					attachments={attachments}
					pending={pending}
					onValueChange={onValueChange}
					onAttachmentsChange={onAttachmentsChange}
				/>
			))}
		</div>
	);
}

function ReportFormNodeView({
	node,
	values,
	attachments,
	pending,
	onValueChange,
	onAttachmentsChange,
}: {
	node: ReportFormNode;
	values: Record<string, string>;
	attachments: Record<string, ReportAttachmentDraft[]>;
	pending?: boolean;
	onValueChange: (id: string, value: string) => void;
	onAttachmentsChange: (fieldId: string, files: ReportAttachmentDraft[]) => void;
}) {
	if (node.type === "section") {
		return (
			<ReportSectionView
				section={node}
				values={values}
				attachments={attachments}
				pending={pending}
				onValueChange={onValueChange}
				onAttachmentsChange={onAttachmentsChange}
			/>
		);
	}

	if (node.type === "group") {
		return (
			<ReportFieldGroupView
				group={node}
				values={values}
				attachments={attachments}
				pending={pending}
				onValueChange={onValueChange}
				onAttachmentsChange={onAttachmentsChange}
			/>
		);
	}

	return (
		<ReportFieldControl
			field={node}
			value={values[node.id] ?? ""}
			attachmentFiles={attachments[node.id] ?? []}
			pending={pending}
			onValueChange={onValueChange}
			onAttachmentsChange={onAttachmentsChange}
		/>
	);
}

function ReportSectionView({
	section,
	values,
	attachments,
	pending,
	onValueChange,
	onAttachmentsChange,
}: {
	section: ReportSectionNode;
	values: Record<string, string>;
	attachments: Record<string, ReportAttachmentDraft[]>;
	pending?: boolean;
	onValueChange: (id: string, value: string) => void;
	onAttachmentsChange: (fieldId: string, files: ReportAttachmentDraft[]) => void;
}) {
	return (
		<ReportFormSection title={section.title} description={section.description}>
			{section.children.map((child) => (
				<ReportFormNodeView
					key={child.type === "field" ? child.id : child.id}
					node={child}
					values={values}
					attachments={attachments}
					pending={pending}
					onValueChange={onValueChange}
					onAttachmentsChange={onAttachmentsChange}
				/>
			))}
		</ReportFormSection>
	);
}

function horizontalGridClass(childCount: number): string {
	if (childCount <= 1) return "grid-cols-1";
	if (childCount === 2) return "grid-cols-1 sm:grid-cols-2";
	if (childCount === 3) return "grid-cols-1 sm:grid-cols-3";
	return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

function ReportFieldGroupView({
	group,
	values,
	attachments,
	pending,
	onValueChange,
	onAttachmentsChange,
}: {
	group: ReportFieldGroupNode;
	values: Record<string, string>;
	attachments: Record<string, ReportAttachmentDraft[]>;
	pending?: boolean;
	onValueChange: (id: string, value: string) => void;
	onAttachmentsChange: (fieldId: string, files: ReportAttachmentDraft[]) => void;
}) {
	const isHorizontal = group.layout === "horizontal";
	const childCount = group.children.length;
	const bordered = group.bordered === true;
	const dense = group.dense !== false;

	const grid = (
		<div
			className={cn(
				"grid min-w-0 gap-3",
				isHorizontal
					? horizontalGridClass(childCount)
					: cn("grid-cols-1", dense ? "gap-3" : "gap-4"),
			)}
		>
			{group.children.map((child) => {
				const span =
					child.type === "field" && isHorizontal ? child.colSpan : undefined;
				return (
					<div
						key={child.type === "field" ? child.id : child.id}
						className={cn(
							span === 2 && "sm:col-span-2",
							span === 3 && "sm:col-span-3",
						)}
					>
						<ReportFormNodeView
							node={child}
							values={values}
							attachments={attachments}
							pending={pending}
							onValueChange={onValueChange}
							onAttachmentsChange={onAttachmentsChange}
						/>
					</div>
				);
			})}
		</div>
	);

	if (bordered) {
		return (
			<fieldset className="work-item-group work-item-group--bordered min-w-0 rounded-lg border border-border/50 px-3 py-2.5">
				{group.label ? (
					<legend className="text-muted-foreground px-0.5 text-xs font-medium">
						{group.label}
					</legend>
				) : null}
				{grid}
			</fieldset>
		);
	}

	return (
		<div
			className={cn(
				"work-item-group min-w-0",
				group.label ? "space-y-1.5" : undefined,
			)}
		>
			{group.label ? (
				<p className="text-muted-foreground text-xs font-medium">{group.label}</p>
			) : null}
			{grid}
		</div>
	);
}

function ReportFieldControl({
	field,
	value,
	attachmentFiles,
	pending,
	onValueChange,
	onAttachmentsChange,
}: {
	field: ReportFieldNode;
	value: string;
	attachmentFiles: ReportAttachmentDraft[];
	pending?: boolean;
	onValueChange: (id: string, value: string) => void;
	onAttachmentsChange: (fieldId: string, files: ReportAttachmentDraft[]) => void;
}) {
	const fieldId = `report-${field.id}`;
	const rows = field.rows ?? (field.kind === "textarea" ? 4 : undefined);

	if (field.kind === "title") {
		return (
			<div className="work-item-field work-item-field--summary">
				<label
					htmlFor={fieldId}
					className="text-muted-foreground mb-1 block text-xs font-medium tracking-wide uppercase"
				>
					{field.label}
					{field.required ? (
						<span className="text-destructive ml-0.5">*</span>
					) : null}
				</label>
				<Input
					id={fieldId}
					value={value}
					onChange={(e) => onValueChange(field.id, e.target.value)}
					placeholder={field.placeholder}
					required={field.required}
					disabled={pending}
					className="h-auto border-0 border-b border-border/80 rounded-none bg-transparent px-0 py-2 text-lg font-medium shadow-none focus-visible:border-primary focus-visible:ring-0"
				/>
				{field.hint ? (
					<p className="text-muted-foreground mt-1 text-xs leading-relaxed">
						{field.hint}
					</p>
				) : null}
			</div>
		);
	}

	if (field.kind === "markdown") {
		return (
			<MarkdownField
				id={fieldId}
				label={field.label}
				value={value}
				onChange={(next) => onValueChange(field.id, next)}
				placeholder={field.placeholder}
				hint={field.hint}
				required={field.required}
				disabled={pending}
				rows={rows ?? 5}
			/>
		);
	}

	if (field.kind === "steps") {
		return (
			<StepsField
				id={fieldId}
				label={field.label}
				value={value}
				onChange={(next) => onValueChange(field.id, next)}
				placeholder={field.placeholder}
				hint={field.hint}
				disabled={pending}
				variant="numbered"
			/>
		);
	}

	if (field.kind === "subtasks") {
		return (
			<StepsField
				id={fieldId}
				label={field.label}
				value={value}
				onChange={(next) => onValueChange(field.id, next)}
				placeholder={field.placeholder ?? "Describe this subtask…"}
				hint={field.hint}
				disabled={pending}
				variant="checklist"
				addLabel="Add subtask"
			/>
		);
	}

	if (field.kind === "attachments") {
		return (
			<AttachmentsField
				id={fieldId}
				label={field.label}
				hint={field.hint}
				files={attachmentFiles}
				onChange={(files) => onAttachmentsChange(field.id, files)}
				disabled={pending}
			/>
		);
	}

	if (field.kind === "text") {
		return (
			<div className="work-item-field min-w-0">
				<label
					htmlFor={fieldId}
					className="text-foreground/90 mb-1.5 block text-sm font-medium"
				>
					{field.label}
					{field.required ? (
						<span className="text-destructive ml-0.5">*</span>
					) : null}
				</label>
				<Input
					id={fieldId}
					value={value}
					onChange={(e) => onValueChange(field.id, e.target.value)}
					placeholder={field.placeholder}
					required={field.required}
					disabled={pending}
				/>
				{field.hint ? (
					<p className="text-muted-foreground mt-1.5 text-xs">{field.hint}</p>
				) : null}
			</div>
		);
	}

	if (field.kind === "textarea") {
		return (
			<div className="work-item-field min-w-0">
				<label
					htmlFor={fieldId}
					className="text-foreground/90 mb-1.5 block text-sm font-medium"
				>
					{field.label}
				</label>
				<Textarea
					id={fieldId}
					value={value}
					onChange={(e) => onValueChange(field.id, e.target.value)}
					placeholder={field.placeholder}
					rows={rows}
					disabled={pending}
					className="min-h-[5rem] resize-y"
				/>
			</div>
		);
	}

	if (field.kind === "spec-parent") {
		return (
			<SpecParentField
				id={fieldId}
				label={field.label}
				value={value}
				hint={field.hint}
				required={field.required}
				disabled={pending}
				onChange={(next) => onValueChange(field.id, next)}
			/>
		);
	}

	if (field.kind === "related-topics") {
		return (
			<RelatedTopicsField
				id={fieldId}
				label={field.label}
				value={value || "[]"}
				hint={field.hint}
				disabled={pending}
				onChange={(next) => onValueChange(field.id, next)}
			/>
		);
	}

	if (field.kind === "layout-preset") {
		return (
			<LayoutPresetField
				label={field.label}
				value={value}
				hint={field.hint}
				disabled={pending}
				onChange={(next) => onValueChange(field.id, next)}
			/>
		);
	}

	if (field.kind === "select" && field.options?.length) {
		const selectId = `${field.id}-select`;

		return (
			<div className="work-item-field min-w-0">
				<label
					htmlFor={selectId}
					className="text-foreground/90 mb-1.5 block text-sm font-medium"
				>
					{field.label}
				</label>
				<Select
					value={value || undefined}
					onValueChange={(next) => onValueChange(field.id, next)}
					disabled={pending}
				>
					<SelectTrigger id={selectId}>
						<SelectValue placeholder={field.placeholder ?? "Choose…"} />
					</SelectTrigger>
					<SelectContent>
						{field.options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	return null;
}

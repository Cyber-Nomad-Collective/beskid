"use client";

import { type ReactNode, useMemo, useState } from "react";

import { ReportFormLayoutView } from "#/components/report-form-layout";
import { Button } from "#/components/ui/button";
import {
	fileToBase64,
	type ReportAttachmentDraft,
	serializeStepsValue,
	serializeSubtasksValue,
} from "#/lib/report-issue/field-values";
import {
	buildReportBody,
	collectAttachmentFieldIds,
	collectReportFields,
	findTitleField,
	type ReportFormLayout,
} from "#/lib/report-issue/fields";

export interface ReportIssueSubmitPayload {
	values: Record<string, string>;
	attachmentsByField: Record<string, ReportAttachmentDraft[]>;
	attachments: Array<{ name: string; contentBase64: string }>;
}

export interface ReportIssueFormProps {
	layout: ReportFormLayout;
	submitLabel?: string;
	pending?: boolean;
	errorMessage?: string | null;
	submitDisabled?: boolean;
	footer?: ReactNode;
	onSubmit: (payload: ReportIssueSubmitPayload) => void;
	onCancel?: () => void;
}

export function ReportIssueForm({
	layout,
	submitLabel = "Submit report",
	pending = false,
	errorMessage,
	submitDisabled = false,
	footer,
	onSubmit,
	onCancel,
}: ReportIssueFormProps) {
	const fieldList = useMemo(() => collectReportFields(layout), [layout]);
	const attachmentFieldIds = useMemo(
		() => collectAttachmentFieldIds(layout),
		[layout],
	);

	const initialValues = useMemo(() => {
		const next: Record<string, string> = {};
		for (const field of fieldList) {
			if (field.kind === "steps") {
				next[field.id] = serializeStepsValue([
					{ id: crypto.randomUUID(), text: "" },
				]);
			} else if (field.kind === "subtasks") {
				next[field.id] = serializeSubtasksValue([
					{ id: crypto.randomUUID(), text: "", done: false },
				]);
			} else {
				next[field.id] = "";
			}
		}
		return next;
	}, [fieldList]);

	const [values, setValues] = useState(initialValues);
	const [attachmentsByField, setAttachmentsByField] = useState<
		Record<string, ReportAttachmentDraft[]>
	>({});

	const titleField = findTitleField(layout);
	const canSubmit =
		!pending &&
		!submitDisabled &&
		(!titleField?.required || values[titleField.id]?.trim().length > 0);

	const setValue = (id: string, value: string) => {
		setValues((prev) => ({ ...prev, [id]: value }));
	};

	const setAttachments = (fieldId: string, files: ReportAttachmentDraft[]) => {
		setAttachmentsByField((prev) => ({ ...prev, [fieldId]: files }));
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!canSubmit) return;

		const uploads: Array<{ name: string; contentBase64: string }> = [];
		for (const fieldId of attachmentFieldIds) {
			for (const item of attachmentsByField[fieldId] ?? []) {
				uploads.push({
					name: item.file.name,
					contentBase64: await fileToBase64(item.file),
				});
			}
		}

		onSubmit({ values, attachmentsByField, attachments: uploads });
	};

	return (
		<form
			className="work-item-form-shell flex flex-col gap-4"
			onSubmit={handleSubmit}
		>
			<ReportFormLayoutView
				layout={layout}
				values={values}
				attachments={attachmentsByField}
				pending={pending}
				onValueChange={setValue}
				onAttachmentsChange={setAttachments}
			/>

			{footer}

			{errorMessage ? (
				<p className="text-destructive text-sm" role="alert">
					{errorMessage}
				</p>
			) : null}

			<div className="work-item-form__actions flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
				{onCancel ? (
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={pending}
					>
						Cancel
					</Button>
				) : null}
				<Button type="submit" disabled={!canSubmit}>
					{pending ? "Submitting…" : submitLabel}
				</Button>
			</div>
		</form>
	);
}

export { buildReportBody };

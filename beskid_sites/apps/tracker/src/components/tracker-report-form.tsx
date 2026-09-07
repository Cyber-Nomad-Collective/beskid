"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import { ReportIssueForm } from "#/components/report-issue-form";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	buildReportBody,
	collectReportFields,
	findTitleField,
} from "#/lib/report-issue/fields";
import {
	subtasksFromFormValue,
	upsertSubtasksInBody,
} from "#/lib/roadmap/subtasks";
import {
	formatTrackerScopeHeader,
	resolveReportLayout,
	TRACKER_COMPONENTS,
	type TrackerReportKind,
} from "#/lib/tracker/taxonomy";
import { cn } from "#/lib/utils";

export interface TrackerScopePickerProps {
	componentId: string;
	subcomponentId: string;
	onComponentChange: (id: string) => void;
	onSubcomponentChange: (id: string) => void;
	disabled?: boolean;
}

export function TrackerScopePicker({
	componentId,
	subcomponentId,
	onComponentChange,
	onSubcomponentChange,
	disabled,
}: TrackerScopePickerProps) {
	const component = TRACKER_COMPONENTS.find((c) => c.id === componentId);
	const subcomponents = component?.subcomponents ?? [];

	return (
		<div className="work-item-scope space-y-2 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
			<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
				Area
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label className="text-sm">Component</Label>
					<Select
						value={componentId}
						onValueChange={onComponentChange}
						disabled={disabled}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose area…" />
						</SelectTrigger>
						<SelectContent>
							{TRACKER_COMPONENTS.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<Label className="text-sm">Subcomponent</Label>
					<Select
						value={subcomponentId || undefined}
						onValueChange={onSubcomponentChange}
						disabled={disabled || subcomponents.length === 0}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose sub-area…" />
						</SelectTrigger>
						<SelectContent>
							{subcomponents.map((sub) => (
								<SelectItem key={sub.id} value={sub.id}>
									{sub.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			{component ? (
				<p className="text-muted-foreground text-xs leading-relaxed">
					{component.description}
				</p>
			) : null}
		</div>
	);
}

export interface TrackerReportSubmitPayload {
	title: string;
	body: string;
	componentId: string;
	subcomponentId: string;
	attachments: Array<{ name: string; contentBase64: string }>;
}

export interface TrackerReportFormProps {
	kind: TrackerReportKind;
	submitLabel?: string;
	pending?: boolean;
	errorMessage?: string | null;
	submitDisabled?: boolean;
	footer?: ReactNode;
	onSubmit: (payload: TrackerReportSubmitPayload) => void;
	onCancel?: () => void;
	defaultComponentId?: string;
}

export function TrackerReportForm({
	kind,
	submitLabel,
	pending,
	errorMessage,
	submitDisabled,
	footer,
	onSubmit,
	onCancel,
	defaultComponentId = TRACKER_COMPONENTS[0]?.id ?? "compiler",
}: TrackerReportFormProps) {
	const [componentId, setComponentId] = useState(defaultComponentId);
	const component = TRACKER_COMPONENTS.find((c) => c.id === componentId);
	const subcomponents = component?.subcomponents ?? [];
	const [subcomponentId, setSubcomponentId] = useState(
		subcomponents[0]?.id ?? "",
	);

	useEffect(() => {
		const first = subcomponents[0]?.id ?? "";
		setSubcomponentId((current) =>
			subcomponents.some((s) => s.id === current) ? current : first,
		);
	}, [subcomponents]);

	const layout = useMemo(
		() => resolveReportLayout(kind, componentId),
		[kind, componentId],
	);

	const scopeReady = Boolean(componentId && subcomponentId);

	return (
		<div className={cn("work-item-dialog-body flex flex-col gap-4")}>
			<TrackerScopePicker
				componentId={componentId}
				subcomponentId={subcomponentId}
				onComponentChange={setComponentId}
				onSubcomponentChange={setSubcomponentId}
				disabled={pending}
			/>

			{scopeReady ? (
				<ReportIssueForm
					key={`${kind}-${componentId}-${subcomponentId}`}
					layout={layout}
					submitLabel={submitLabel}
					pending={pending}
					errorMessage={errorMessage}
					onCancel={onCancel}
					submitDisabled={submitDisabled}
					footer={footer}
					onSubmit={({ values, attachments, attachmentsByField }) => {
						const titleField = findTitleField(layout);
						const title = titleField ? values[titleField.id]?.trim() : "";
						if (!title) return;

						let body =
							formatTrackerScopeHeader(componentId, subcomponentId) +
							buildReportBody(layout, values, attachmentsByField);

						const subtasksField = collectReportFields(layout).find(
							(field) => field.kind === "subtasks",
						);
						if (subtasksField) {
							body = upsertSubtasksInBody(
								body,
								subtasksFromFormValue(values[subtasksField.id] ?? ""),
							);
						}

						onSubmit({
							title,
							body,
							componentId,
							subcomponentId,
							attachments,
						});
					}}
				/>
			) : (
				<p className="text-muted-foreground text-sm">
					Select a component and subcomponent to continue.
				</p>
			)}
		</div>
	);
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { RepoPathField } from "#/components/repo-path-field";
import { SpecRelationEditor } from "#/components/spec-relation-editor";
import { TrackerReportForm } from "#/components/tracker-report-form";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import { ROADMAP_COLUMNS } from "#/lib/github/roadmap-labels";
import type { SpecRelation } from "#/lib/platform-spec/relations";
import { createBoardIssue } from "#/server/roadmap";

export interface CreateTaskFormProps {
	version: string;
	workstreamOptions?: string[];
	/** Pre-select workstream; when set, the field is read-only. */
	defaultWorkstream?: string;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function CreateTaskForm({
	version,
	workstreamOptions = [],
	defaultWorkstream,
	onSuccess,
	onCancel,
}: CreateTaskFormProps) {
	const router = useRouter();
	const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
	const [statusColumn, setStatusColumn] = useState<RoadmapColumnId>("Backlog");
	const [workstream, setWorkstream] = useState<string | undefined>(
		defaultWorkstream,
	);
	const [customWorkstream, setCustomWorkstream] = useState("");
	const [specRelations, setSpecRelations] = useState<SpecRelation[]>([]);
	const [repoPaths, setRepoPaths] = useState<string[]>([]);

	const hasRequiredRelation = specRelations.some((r) => r.required);
	const specReady = specRelations.length > 0 && hasRequiredRelation;

	const mutation = useMutation({
		mutationFn: (payload: {
			title: string;
			body: string;
			componentId: string;
			subcomponentId: string;
		}) =>
			createBoardIssue({
				data: {
					title: payload.title,
					body: payload.body,
					priority,
					statusColumn,
					version,
					workstream:
						defaultWorkstream ??
						(workstream === "__custom__"
							? slugifyWorkstream(customWorkstream)
							: workstream),
					specRelations,
					repoPaths,
					componentId: payload.componentId,
					subcomponentId: payload.subcomponentId,
				},
			}),
		onSuccess: async () => {
			resetMeta();
			onSuccess?.();
			await router.invalidate();
		},
	});

	const resetMeta = () => {
		setPriority("medium");
		setStatusColumn("Backlog");
		setWorkstream(defaultWorkstream);
		setCustomWorkstream("");
		setSpecRelations([]);
		setRepoPaths([]);
	};

	const roadmapFooter = (
		<div className="flex flex-col gap-2.5 border-t border-border/60 pt-3">
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
				<div className="space-y-1">
					<Label className="text-xs">Status</Label>
					<Select
						value={statusColumn}
						onValueChange={(v) => setStatusColumn(v as RoadmapColumnId)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ROADMAP_COLUMNS.map((col) => (
								<SelectItem key={col.id} value={col.id}>
									{col.id}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Priority</Label>
					<Select
						value={priority}
						onValueChange={(v) => setPriority(v as "high" | "medium" | "low")}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="high">High</SelectItem>
							<SelectItem value="medium">Medium</SelectItem>
							<SelectItem value="low">Low</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1 sm:col-span-1">
					<Label className="text-xs">Workstream</Label>
					{defaultWorkstream ? (
						<Input
							value={defaultWorkstream}
							readOnly
							className="bg-muted font-mono text-xs"
						/>
					) : (
						<Select
							value={workstream ?? "__none__"}
							onValueChange={(v) => setWorkstream(v === "__none__" ? undefined : v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Optional" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{workstreamOptions.map((ws) => (
									<SelectItem key={ws} value={ws}>
										{ws}
									</SelectItem>
								))}
								<SelectItem value="__custom__">New workstream…</SelectItem>
							</SelectContent>
						</Select>
					)}
				</div>
			</div>
			{workstream === "__custom__" ? (
				<Input
					value={customWorkstream}
					onChange={(e) => setCustomWorkstream(e.target.value)}
					placeholder="e.g. compiler-pipeline"
				/>
			) : null}
			<SpecRelationEditor relations={specRelations} onChange={setSpecRelations} />
			{specRelations.length > 0 && !hasRequiredRelation ? (
				<p className="text-muted-foreground text-xs">
					Mark at least one spec relation as required.
				</p>
			) : null}
			<RepoPathField paths={repoPaths} onChange={setRepoPaths} />
		</div>
	);

	return (
		<TrackerReportForm
			kind="task"
			pending={mutation.isPending}
			submitDisabled={!specReady}
			footer={roadmapFooter}
			submitLabel={mutation.isPending ? "Creating…" : "Create task"}
			errorMessage={
				mutation.isError
					? mutation.error instanceof Error
						? mutation.error.message
						: "Could not create the task."
					: null
			}
			onSubmit={(payload) => mutation.mutate(payload)}
			onCancel={onCancel}
		/>
	);
}

function slugifyWorkstream(value: string): string | undefined {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug || undefined;
}

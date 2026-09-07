"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { CreateTaskForm } from "#/components/create-task-form";
import { TaskDisplay } from "#/components/task-display";
import {
	type WorkItemPresentation,
	WorkItemShell,
	type WorkItemShellRouteTarget,
} from "#/components/work-item-shell/work-item-shell";
import type { RoadmapTask } from "#/lib/github/types";

const TASK_TITLE = "Create roadmap task";

function taskPreview(version: string, workstream?: string): RoadmapTask {
	return {
		id: "preview",
		number: 0,
		title: "New roadmap task",
		owner: "Unassigned",
		priority: "medium",
		statusColumn: "Backlog",
		body: "",
		specRelations: [],
		subtasks: [],
		repoPaths: [],
		specApproval: undefined,
		version,
		workstream,
		htmlUrl: "",
		labelNames: [],
	};
}

function taskDescription(version: string) {
	return (
		<>
			Tasks are GitHub issues labeled for version{" "}
			<span className="font-mono">{version}</span>, workstream, and spec relations.
			Fields depend on the component you select.
		</>
	);
}

export interface CreateTaskWorkItemProps {
	presentation: WorkItemPresentation;
	version: string;
	workstreamOptions?: string[];
	/** Pre-select and lock workstream (workstream-scoped boards). */
	defaultWorkstream?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onClose?: () => void;
	onCreated?: () => void;
	expandTo?: WorkItemShellRouteTarget;
	collapseTo?: WorkItemShellRouteTarget;
	dialogTrigger?: React.ReactNode;
}

export function CreateTaskWorkItem({
	presentation,
	version,
	workstreamOptions = [],
	defaultWorkstream,
	open = true,
	onOpenChange,
	onClose,
	onCreated,
	expandTo,
	collapseTo,
	dialogTrigger,
}: CreateTaskWorkItemProps) {
	const handleClose = () => {
		onClose?.();
		onOpenChange?.(false);
	};

	const handleSuccess = () => {
		onCreated?.();
		handleClose();
	};

	return (
		<WorkItemShell
			presentation={presentation}
			title={TASK_TITLE}
			description={
				presentation === "page"
					? undefined
					: `GitHub issues for version ${version}.`
			}
			open={open}
			onOpenChange={onOpenChange}
			onClose={handleClose}
			expandTo={expandTo}
			collapseTo={collapseTo}
			dialogTrigger={dialogTrigger}
		>
			{presentation === "dialog" ? (
				<div className="min-h-0">
					<div className="border-b border-border/60 px-1 pb-3 text-xs font-medium text-muted-foreground">
						<span className="mr-4 text-foreground">Overview</span>
						<span className="mr-4">Delivery</span>
						<span className="mr-4">Specification</span>
						<span>Provenance</span>
					</div>
					<Group
						orientation="horizontal"
						className="mt-4 min-h-[30rem] flex-col md:flex-row"
					>
						<Panel defaultSize="70%" minSize="45%" className="overflow-y-auto pr-3">
							<CreateTaskForm
								version={version}
								workstreamOptions={workstreamOptions}
								defaultWorkstream={defaultWorkstream}
								onSuccess={handleSuccess}
								onCancel={handleClose}
							/>
						</Panel>
						<Separator className="hidden w-px bg-border md:block" />
						<Panel
							defaultSize="30%"
							minSize="20%"
							className="border-t border-border pt-4 md:border-t-0 md:pt-0 md:pl-4"
						>
							<p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
								Preview
							</p>
							<TaskDisplay
								task={taskPreview(version, defaultWorkstream)}
								variant="preview"
							/>
							<p className="text-muted-foreground mt-4 text-xs leading-relaxed">
								The card reflects the selected delivery fields when created.
							</p>
						</Panel>
					</Group>
				</div>
			) : presentation === "page" ? (
				<p className="text-muted-foreground mb-4 text-sm leading-relaxed">
					{taskDescription(version)}
				</p>
			) : null}
			<CreateTaskForm
				version={version}
				workstreamOptions={workstreamOptions}
				defaultWorkstream={defaultWorkstream}
				onSuccess={handleSuccess}
				onCancel={handleClose}
			/>
		</WorkItemShell>
	);
}

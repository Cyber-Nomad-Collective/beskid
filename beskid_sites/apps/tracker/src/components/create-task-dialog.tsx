"use client";

import { type ReactNode, useState } from "react";

import { CreateTaskWorkItem } from "#/components/create-task-work-item";
import { Button } from "#/components/ui/button";
import { DialogTrigger } from "#/components/ui/dialog";
import type { WorkItemShellRouteTarget } from "#/components/work-item-shell/work-item-shell";

export interface CreateTaskDialogProps {
	version: string;
	workstreamOptions?: string[];
	expandTo?: WorkItemShellRouteTarget;
	triggerLabel?: string;
	trigger?: ReactNode;
}

/** Create-task flow in a dialog (board uses pane; use page route for fullscreen). */
export function CreateTaskDialog({
	version,
	workstreamOptions = [],
	expandTo,
	triggerLabel = "New task",
	trigger,
}: CreateTaskDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<CreateTaskWorkItem
			presentation="dialog"
			version={version}
			workstreamOptions={workstreamOptions}
			open={open}
			onOpenChange={setOpen}
			expandTo={expandTo}
			dialogTrigger={
				trigger ? (
					<DialogTrigger asChild>{trigger}</DialogTrigger>
				) : (
					<DialogTrigger asChild>
						<Button>{triggerLabel}</Button>
					</DialogTrigger>
				)
			}
		/>
	);
}

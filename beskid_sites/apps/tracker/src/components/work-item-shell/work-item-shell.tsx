"use client";

import type { ReactNode } from "react";

import { MarkdownContent } from "#/components/markdown-content";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { WorkItemShellHeader } from "#/components/work-item-shell/work-item-shell-header";
import type { BoardSearchParams } from "#/lib/roadmap/board-search";
import { cn } from "#/lib/utils";

export type WorkItemPresentation = "dialog" | "page" | "pane";

export interface WorkItemShellRouteTarget {
	to: string;
	params?: Record<string, string>;
	search?: BoardSearchParams | undefined;
}

export interface WorkItemShellProps {
	presentation: WorkItemPresentation;
	title: string;
	description?: string;
	children: ReactNode;
	/** Dialog + pane: controlled open state. */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onClose?: () => void;
	expandTo?: WorkItemShellRouteTarget;
	collapseTo?: WorkItemShellRouteTarget;
	headerActions?: ReactNode;
	/** Rendered inside the dialog root (e.g. DialogTrigger). */
	dialogTrigger?: ReactNode;
	className?: string;
}

export function WorkItemShell({
	presentation,
	title,
	description,
	children,
	open,
	onOpenChange,
	onClose,
	expandTo,
	collapseTo,
	headerActions,
	dialogTrigger,
	className,
}: WorkItemShellProps) {
	const header = (
		<WorkItemShellHeader
			presentation={presentation}
			title={title}
			description={presentation === "dialog" ? undefined : description}
			onClose={onClose ?? (() => onOpenChange?.(false))}
			expandTo={expandTo}
			collapseTo={collapseTo}
			actions={headerActions}
		/>
	);

	const body = (
		<div
			className={cn(
				"work-item-shell__body min-h-0 flex-1 overflow-y-auto",
				presentation === "page" && "px-4 py-4 md:px-6 md:py-5",
				presentation === "pane" && "px-3 py-3",
				presentation === "dialog" && "px-0 pb-0",
				className,
			)}
		>
			{children}
		</div>
	);

	if (presentation === "dialog") {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				{dialogTrigger}
				<DialogContent
					showCloseButton={false}
					className="work-item-dialog work-item-shell work-item-shell--dialog flex max-h-[min(92vh,52rem)] flex-col gap-0 overflow-hidden sm:max-w-3xl"
				>
					<DialogTitle className="sr-only">{title}</DialogTitle>
					{description ? (
						<DialogDescription className="sr-only">{description}</DialogDescription>
					) : null}
					<div className="px-6 pt-6">
						{header}
						<MarkdownContent optional className="mt-2 max-w-2xl pr-4">
							{description ?? ""}
						</MarkdownContent>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (presentation === "pane") {
		if (!open) return null;
		return (
			<aside
				className={cn(
					"work-item-shell work-item-shell--pane board-task-pane flex h-full min-h-0 w-full max-w-[28rem] shrink-0 flex-col border-l border-border/80 bg-background shadow-lg",
					className,
				)}
				aria-label={title}
			>
				{header}
				{body}
			</aside>
		);
	}

	return (
		<div
			className={cn(
				"work-item-shell work-item-shell--page flex min-h-0 flex-1 flex-col",
				className,
			)}
		>
			{header}
			{body}
		</div>
	);
}

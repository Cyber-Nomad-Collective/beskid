"use client";

import { Link } from "@tanstack/react-router";
import { ArrowLeft, Maximize2, Minimize2, X } from "lucide-react";
import type { ReactNode } from "react";

import { MarkdownContent } from "#/components/markdown-content";
import { Button } from "#/components/ui/button";
import type { WorkItemPresentation } from "#/components/work-item-shell/work-item-shell";
import type { BoardSearchParams } from "#/lib/roadmap/board-search";
import { cn } from "#/lib/utils";

export interface WorkItemShellHeaderProps {
	presentation: WorkItemPresentation;
	title: string;
	description?: string;
	onClose?: () => void;
	expandTo?: {
		to: string;
		params?: Record<string, string>;
		search?: BoardSearchParams | undefined;
	};
	collapseTo?: {
		to: string;
		params?: Record<string, string>;
		search?: BoardSearchParams | undefined;
	};
	actions?: ReactNode;
}

export function WorkItemShellHeader({
	presentation,
	title,
	description,
	onClose,
	expandTo,
	collapseTo,
	actions,
}: WorkItemShellHeaderProps) {
	const showExpand =
		(presentation === "dialog" || presentation === "pane") && expandTo;
	const showCollapse = presentation === "page" && collapseTo;

	return (
		<header
			className={cn(
				"work-item-shell__header shrink-0",
				presentation === "page" && "border-b border-border/60 px-4 py-3 md:px-6",
				presentation === "pane" && "border-b border-border/60 px-3 py-2.5",
				presentation === "dialog" && "pr-8",
			)}
		>
			<div className="flex items-start gap-2">
				{showCollapse && collapseTo ? (
					<Button variant="ghost" size="icon-sm" className="mt-0.5 shrink-0" asChild>
						<Link
							to={collapseTo.to}
							params={collapseTo.params}
							search={collapseTo.search}
						>
							<ArrowLeft className="size-4" />
							<span className="sr-only">Back to board</span>
						</Link>
					</Button>
				) : null}
				<div className="min-w-0 flex-1">
					<h2
						className={cn(
							"font-semibold tracking-tight",
							presentation === "page" ? "text-lg" : "text-base",
						)}
					>
						{title}
					</h2>
					<MarkdownContent optional className="mt-1 max-w-2xl">
						{description ?? ""}
					</MarkdownContent>
				</div>
				<div className="flex shrink-0 items-center gap-0.5">
					{actions}
					{showExpand && expandTo ? (
						<Button variant="ghost" size="icon-sm" asChild title="Open full page">
							<Link to={expandTo.to} params={expandTo.params} search={expandTo.search}>
								<Maximize2 className="size-4" />
								<span className="sr-only">Open full page</span>
							</Link>
						</Button>
					) : null}
					{showCollapse && collapseTo ? (
						<Button variant="ghost" size="icon-sm" asChild title="Dock to board pane">
							<Link
								to={collapseTo.to}
								params={collapseTo.params}
								search={collapseTo.search}
							>
								<Minimize2 className="size-4" />
								<span className="sr-only">Dock to board pane</span>
							</Link>
						</Button>
					) : null}
					{presentation !== "page" && onClose ? (
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={onClose}
							title="Close"
						>
							<X className="size-4" />
							<span className="sr-only">Close</span>
						</Button>
					) : null}
				</div>
			</div>
		</header>
	);
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { TrackerReportForm } from "#/components/tracker-report-form";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import type { AuthUser } from "#/lib/github/types";
import { createPublicBugFn } from "#/server/public-bugs";

export interface ReportIssueDialogProps {
	user: AuthUser | null;
	title?: string;
	description?: string;
	triggerLabel?: string;
	trigger?: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function ReportIssueDialog({
	user,
	title = "Report a bug",
	description = "Creates a GitHub issue on the superrepo with the bug label. Pick the component area so the right maintainers see context-specific fields.",
	triggerLabel = "Report a bug",
	trigger,
	open: controlledOpen,
	onOpenChange,
}: ReportIssueDialogProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;

	const mutation = useMutation({
		mutationFn: createPublicBugFn,
		onSuccess: async () => {
			setOpen(false);
			await queryClient.invalidateQueries();
			await router.invalidate();
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger !== false
				? (trigger ?? (
						<DialogTrigger asChild>
							<Button variant="outline" size="sm">
								{triggerLabel}
							</Button>
						</DialogTrigger>
					))
				: null}
			<DialogContent className="work-item-dialog sm:max-w-3xl max-h-[min(92vh,52rem)] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{user ? (
					<TrackerReportForm
						kind="bug"
						pending={mutation.isPending}
						errorMessage={
							mutation.isError
								? mutation.error instanceof Error
									? mutation.error.message
									: "Could not create the bug report. Try again."
								: null
						}
						onSubmit={(payload) =>
							mutation.mutate({
								data: {
									title: payload.title,
									body: payload.body,
									componentId: payload.componentId,
									subcomponentId: payload.subcomponentId,
									attachments:
										payload.attachments.length > 0 ? payload.attachments : undefined,
								},
							})
						}
						onCancel={() => setOpen(false)}
						submitLabel="Create bug report"
					/>
				) : (
					<div className="space-y-4">
						<p className="text-muted-foreground text-sm">
							Sign in with GitHub to file a bug through the tracker. Your account will
							be attributed on the task.
						</p>
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button asChild>
								<a href="/api/auth/github" className="text-primary-foreground">
									Sign in with GitHub
								</a>
							</Button>
						</div>
						<p className="text-muted-foreground text-center text-xs">
							<Link to="/bugs" className="underline-offset-4 hover:underline">
								Browse open bugs
							</Link>{" "}
							without signing in.
						</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

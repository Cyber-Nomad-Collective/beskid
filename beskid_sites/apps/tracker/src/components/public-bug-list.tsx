"use client";

import { useState } from "react";

import { BugDetailSheet } from "#/components/bug-detail-sheet";
import { ReportIssueDialog } from "#/components/report-issue-dialog";
import { Badge } from "#/components/ui/badge";
import type { AuthUser, PublicBug } from "#/lib/github/types";

interface PublicBugListProps {
	bugs: PublicBug[];
	user: AuthUser | null;
	/** Unfiltered tracker bug count before meta search. */
	catalogCount?: number;
	rateLimited?: boolean;
}

export function PublicBugList({
	bugs,
	user,
	catalogCount = 0,
	rateLimited,
}: PublicBugListProps) {
	const [selected, setSelected] = useState<PublicBug | null>(null);
	const [open, setOpen] = useState(false);

	const openBug = (bug: PublicBug) => {
		setSelected(bug);
		setOpen(true);
	};

	if (bugs.length === 0) {
		const noSearchMatches = !rateLimited && catalogCount > 0;
		return (
			<div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
				<p className="text-muted-foreground text-sm">
					{rateLimited ? (
						"Could not load bugs from the tracker database. Check the bug webhook and export configuration."
					) : noSearchMatches ? (
						"No bugs match your search. Try different keywords or clear the search bar."
					) : (
						<>
							No open issues labeled <code className="text-xs">bug</code> yet.
						</>
					)}
				</p>
				<div className="mt-4 flex justify-center">
					<ReportIssueDialog
						user={user}
						triggerLabel="Report a bug"
						description="File the first bug report on the superrepo through the tracker."
					/>
				</div>
			</div>
		);
	}

	return (
		<>
			<ul className="grid gap-3">
				{bugs.map((bug) => (
					<li key={bug.number}>
						<button
							type="button"
							className="kanban-card w-full cursor-pointer rounded-xl border border-border/60 bg-card/40 p-4 text-left transition-colors hover:bg-card/70"
							onClick={() => openBug(bug)}
						>
							<div className="flex flex-wrap items-start justify-between gap-2">
								<p className="text-sm leading-snug font-medium">
									<span className="text-muted-foreground mr-1.5 font-mono text-xs">
										#{bug.number}
									</span>
									{bug.title}
								</p>
								<Badge variant="secondary">bug</Badge>
							</div>
							{bug.bodyExcerpt ? (
								<p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
									{bug.bodyExcerpt}
								</p>
							) : null}
							<p className="text-muted-foreground mt-2 text-xs">
								{bug.author ? `@${bug.author}` : "Unknown"} ·{" "}
								{new Date(bug.createdAt).toLocaleDateString()}
							</p>
						</button>
					</li>
				))}
			</ul>
			<BugDetailSheet bug={selected} open={open} onOpenChange={setOpen} />
		</>
	);
}

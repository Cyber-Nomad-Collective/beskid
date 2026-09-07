"use client";

import { ExternalLink } from "lucide-react";

import { MarkdownContent } from "#/components/markdown-content";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { PublicBug } from "#/lib/github/types";

interface BugDetailSheetProps {
	bug: PublicBug | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function BugDetailSheet({
	bug,
	open,
	onOpenChange,
}: BugDetailSheetProps) {
	if (!bug) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="issue-sheet w-full overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						#{bug.number} {bug.title}
					</SheetTitle>
					<SheetDescription>
						{bug.author ? `@${bug.author}` : "Unknown"} ·{" "}
						{new Date(bug.createdAt).toLocaleString()}
					</SheetDescription>
				</SheetHeader>
				<div className="flex flex-col gap-4 px-4">
					<div className="flex flex-wrap gap-2">
						<Badge variant="secondary">bug</Badge>
						<Badge variant="outline">{bug.state}</Badge>
						{bug.labels
							.filter((l) => l !== "bug")
							.map((label) => (
								<Badge key={label} variant="outline" className="font-normal">
									{label}
								</Badge>
							))}
					</div>
					{bug.bodyExcerpt ? (
						<MarkdownContent>{bug.bodyExcerpt}</MarkdownContent>
					) : (
						<p className="text-muted-foreground text-sm">No description preview.</p>
					)}
				</div>
				<SheetFooter>
					<Button variant="outline" asChild>
						<a href={bug.htmlUrl} target="_blank" rel="noopener noreferrer">
							Open on GitHub
							<ExternalLink className="size-3.5" />
						</a>
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

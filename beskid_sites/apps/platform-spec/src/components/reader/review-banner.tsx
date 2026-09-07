" use client";

import { Trash2 } from "lucide-react";

import type { ReviewComment } from "#/components/reader/spec-review-provider";

interface ReviewBannerProps {
	reviewMode: boolean;
	commentCount: number;
	pageSlug: string;
	onCancel: () => void;
	onOpenDialog: () => void;
	comments: ReviewComment[];
	onEditComment: (id: string) => void;
	onRemoveComment: (id: string) => void;
}

export function ReviewBanner({
	reviewMode,
	commentCount,
	pageSlug,
	onCancel,
	onOpenDialog,
	comments,
	onEditComment,
	onRemoveComment,
}: ReviewBannerProps) {
	if (!reviewMode) return null;

	const pageComments = comments.filter((c) => c.pageSlug === pageSlug);

	return (
		<section
			className="sticky top-0 z-20 space-y-3 border-b border-primary/30 bg-background/95 p-4 backdrop-blur"
			data-review-active
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
						Review in progress
					</span>
					<span className="text-xs text-muted-foreground">
						{commentCount} comment
						{commentCount !== 1 ? "s" : ""} total
						{pageComments.length > 0 ? ` (${pageComments.length} on this page)` : ""}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="rounded-md border px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						type="button"
						className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
						onClick={onOpenDialog}
					>
						Submit review
					</button>
				</div>
			</div>

			{pageComments.length > 0 ? (
				<ul className="space-y-2">
					{pageComments.map((comment) => (
						<li
							key={comment.id}
							className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-2"
						>
							<button
								type="button"
								className="min-w-0 flex-1 space-y-1 text-left"
								onClick={() => onEditComment(comment.id)}
							>
								<blockquote className="line-clamp-2 text-xs italic text-muted-foreground">
									&ldquo;{comment.selectedText.slice(0, 150)}
									{comment.selectedText.length > 150 ? "\u2026" : ""}&rdquo;
								</blockquote>
								{comment.body ? (
									<p className="text-sm">{comment.body}</p>
								) : (
									<p className="text-sm italic text-muted-foreground">
										Click to add comment text…
									</p>
								)}
							</button>
							<button
								type="button"
								className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									onRemoveComment(comment.id);
								}}
								aria-label="Remove comment"
							>
								<Trash2 size={14} />
							</button>
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}

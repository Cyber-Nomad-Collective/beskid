" use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search, X } from "lucide-react";

import { createNavSearchResult, highlightTitle } from "#/components/reader/spec-nav-tree";
import type { ReviewComment, ReviewDecision } from "#/components/reader/spec-review-provider";
import type { OpenSpecNavNode } from "#/lib/spec/domain-model";

interface ReviewSubmissionDialogProps {
	open: boolean;
	navTree: OpenSpecNavNode;
	decision: ReviewDecision;
	body: string;
	comments: ReviewComment[];
	onDecisionChange: (decision: ReviewDecision) => void;
	onBodyChange: (body: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

const DECISIONS: Array<{
	value: ReviewDecision;
	label: string;
	description: string;
	icon: string;
}> = [
	{
		value: "approved",
		label: "Approve",
		description: "The specification content is correct and complete.",
		icon: "\u2713",
	},
	{
		value: "changes-requested",
		label: "Request changes",
		description: "Changes are required before this content can be accepted.",
		icon: "\u21A9",
	},
	{
		value: "commented",
		label: "Comment",
		description: "General feedback without explicit approval or rejection.",
		icon: "\uD83D\uDDAC",
	},
];

export function ReviewSubmissionDialog({
	open,
	navTree,
	decision,
	body,
	comments,
	onDecisionChange,
	onBodyChange,
	onSubmit,
	onCancel,
}: ReviewSubmissionDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const dialogRef = useRef<HTMLDialogElement>(null);

	const searchResult = useMemo(
		() =>
			searchQuery.trim()
				? createNavSearchResult(navTree, searchQuery)
				: null,
		[navTree, searchQuery],
	);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open) {
			if (!dialog.open) dialog.showModal();
		} else {
			if (dialog.open) dialog.close();
		}
	}, [open]);

	if (!open) return null;

	return (
		<dialog
			ref={dialogRef}
			className="fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-3xl rounded-xl border border-border bg-background p-0 shadow-2xl backdrop:bg-black/50"
			onClose={onCancel}
		>
			<div className="flex h-full max-h-[90vh] flex-col">
				<div className="flex items-center justify-between border-b border-border px-6 py-4">
					<h2 className="text-lg font-semibold">Submit platform spec review</h2>
					<button
						type="button"
						className="rounded-md p-1 hover:bg-muted"
						onClick={onCancel}
						aria-label="Close dialog"
					>
						<X size={18} />
					</button>
				</div>

				<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
					<fieldset>
						<legend className="mb-2 text-sm font-medium">Review decision</legend>
						<div className="grid gap-2 sm:grid-cols-3">
							{DECISIONS.map((d) => (
								<label
									key={d.value}
									className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors ${decision === d.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}`}
								>
									<input
										type="radio"
										name="review-decision"
										value={d.value}
										checked={decision === d.value}
										onChange={() => onDecisionChange(d.value)}
										className="sr-only"
									/>
									<span className="text-lg">{d.icon}</span>
									<span className="text-sm font-medium">{d.label}</span>
									<span className="text-xs text-muted-foreground">{d.description}</span>
								</label>
							))}
						</div>
					</fieldset>

					<label className="grid gap-1">
						<span className="text-sm font-medium">Review summary</span>
						<textarea
							className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm"
							value={body}
							onChange={(e) => onBodyChange(e.target.value)}
							placeholder="Summarize your review findings, rationale, or recommendations."
						/>
					</label>

					{comments.length > 0 ? (
						<div className="space-y-2">
							<h3 className="text-sm font-medium">Inline comments ({comments.length})</h3>
							<ul className="max-h-40 space-y-1.5 overflow-y-auto">
								{comments.map((comment) => (
									<li
										key={comment.id}
										className="rounded border border-border/60 bg-muted/30 p-2 text-xs"
									>
										<p className="font-mono text-[10px] text-muted-foreground">{comment.pageSlug}</p>
										<blockquote className="mt-1 line-clamp-1 italic text-muted-foreground">&ldquo;{comment.selectedText.slice(0, 100)}&rdquo;</blockquote>
										<p className="mt-1">{comment.body}</p>
									</li>
								))}
							</ul>
						</div>
					) : null}

					<div className="space-y-2">
						<h3 className="text-sm font-medium">Search related specification content</h3>
						<label className="relative block">
							<span className="sr-only">Search</span>
							<Search
								className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
								aria-hidden
							/>
							<input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search specification to find related content…"
								className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm"
						/>
					</label>
						{searchResult ? (
							<div className="max-h-48 overflow-y-auto rounded-lg border p-2">
								{searchResult.matchCount > 0 ? (
									<>
										<p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
											{searchResult.matchCount} results
										</p>
										<ul className="space-y-0.5">
											{renderSearchResults(searchResult.tree, searchQuery, 0)}
										</ul>
									</>
								) : (
									<p className="text-xs text-muted-foreground">No matches.</p>
								)}
							</div>
						) : null}
					</div>
				</div>

				<div className="flex items-center justify-between border-t border-border px-6 py-4">
					<button
						type="button"
						className="rounded-md border px-3 py-1.5 text-sm"
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						type="button"
						className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
						onClick={onSubmit}
					>
						Submit review
					</button>
				</div>
			</div>
		</dialog>
	);
}

function renderSearchResults(
	tree: OpenSpecNavNode | null,
	query: string,
	depth: number,
): React.ReactNode[] {
	if (!tree?.children) return [];
	return tree.children.flatMap((node) => [
		<li
			key={node.slug}
			className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-muted"
			style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
		>
			<FileText size={11} className="shrink-0 text-muted-foreground" />
			<a href={node.href} className="min-w-0 flex-1 truncate">
				<span>
					{highlightTitle(node.title, query).map((range) =>
						range.match ? (
							<mark key={`${range.start}-${range.end}`} className="rounded bg-primary/20 px-0.5 text-inherit">
								{node.title.slice(range.start, range.end)}
							</mark>
						) : (
							<span key={`${range.start}-${range.end}`}>
								{node.title.slice(range.start, range.end)}
							</span>
						))}
				</span>
			</a>
		</li>,
		...renderSearchResults(node, query, depth + 1),
	]);
}

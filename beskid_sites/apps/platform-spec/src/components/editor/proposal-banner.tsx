"use client";

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type {
	DraftChangeKind,
	DraftChangeNode,
	SpecLevel,
} from "#/server/memgraph/types";

export interface ProposalBannerProps {
	/** Existing draft (null when creating new). */
	draft: DraftChangeNode | null;
	/** Controlled proposal fields. */
	title: string;
	summary: string;
	specLevel: SpecLevel;
	changeKind: DraftChangeKind;
	/** Read-only when the draft is no longer editable (submitted/approved/merged). */
	readOnly: boolean;
	/** Toggles the collapsible summary textarea. */
	onTitleChange: (value: string) => void;
	onSummaryChange: (value: string) => void;
	onSpecLevelChange: (value: SpecLevel) => void;
	onChangeKindChange: (value: DraftChangeKind) => void;
}

/**
 * Big proposal banner pinned to the top of the draft editor.
 * Shows the proposal headline (editable title) plus proposal-level metadata:
 * spec level, change kind, status, PR link, and a collapsible summary.
 *
 * All fields map 1:1 to DraftChangeNode — no schema change.
 */
export function ProposalBanner({
	draft,
	title,
	summary,
	specLevel,
	changeKind,
	readOnly,
	onTitleChange,
	onSummaryChange,
	onSpecLevelChange,
	onChangeKindChange,
}: ProposalBannerProps) {
	const [summaryOpen, setSummaryOpen] = useState(summary.trim().length > 0);
	const status = draft?.status ?? "draft";

	return (
		<section
			className="proposal-banner rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-sm"
			data-proposal-status={status}
		>
			<div className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1">
						<label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Proposal title
						</label>
						<input
							className="w-full rounded-md border bg-background px-3 py-2 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							value={title}
							onChange={(e) => onTitleChange(e.target.value)}
							disabled={readOnly}
							placeholder="Proposal title"
						/>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<StatusBadge status={status} />
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-4">
					<label className="grid gap-1 text-sm">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Spec level
						</span>
						<select
							className="rounded-md border bg-background px-3 py-1.5"
							value={specLevel}
							onChange={(e) => onSpecLevelChange(e.target.value as SpecLevel)}
							disabled={readOnly}
						>
							{(["domain", "area", "feature", "article", "adr"] as SpecLevel[]).map(
								(level) => (
									<option key={level} value={level}>
										{level}
									</option>
								),
							)}
						</select>
					</label>
					<label className="grid gap-1 text-sm">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Change kind
						</span>
						<select
							className="rounded-md border bg-background px-3 py-1.5"
							value={changeKind}
							onChange={(e) => onChangeKindChange(e.target.value as DraftChangeKind)}
							disabled={readOnly}
						>
							{(["create", "update", "delete"] as DraftChangeKind[]).map((kind) => (
								<option key={kind} value={kind}>
									{kind}
								</option>
							))}
						</select>
					</label>

					{draft?.prUrl ? (
						<a
							href={draft.prUrl}
							target="_blank"
							rel="noreferrer"
							className="self-end rounded-md border px-3 py-1.5 text-sm underline"
						>
							PR #{draft.prNumber}
						</a>
					) : null}

					<button
						type="button"
						className="self-end rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/40"
						onClick={() => setSummaryOpen((v) => !v)}
					>
						{summaryOpen ? "Hide summary" : "Edit summary"}
					</button>
				</div>

				{summaryOpen ? (
					<label className="grid gap-1 text-sm">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Summary
						</span>
						<textarea
							className="min-h-20 rounded-md border bg-background px-3 py-2"
							value={summary}
							onChange={(e) => onSummaryChange(e.target.value)}
							disabled={readOnly}
							placeholder="One-paragraph summary of what this proposal changes and why."
						/>
					</label>
				) : null}

				{draft?.rejectReason ? (
					<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						Rejected: {draft.rejectReason}
					</p>
				) : null}

				{draft ? (
					<p className="text-xs text-muted-foreground">
						Slug: <code className="font-mono">{draft.slug}</code> · Author: @
						{draft.authorLogin}
						{draft.moderatorLogin ? ` · Moderator: @${draft.moderatorLogin}` : ""}
					</p>
				) : (
					<p className="text-xs text-muted-foreground">
						New proposal — not yet saved.{" "}
						<Link to="/edit" className="underline">
							← Back to drafts
						</Link>
					</p>
				)}
			</div>
		</section>
	);
}

function StatusBadge({ status }: { status: string }) {
	const styles: Record<string, string> = {
		draft: "border-border/60 bg-muted/30 text-muted-foreground",
		submitted: "border-amber-400/40 bg-amber-500/10 text-amber-200",
		approved: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
		rejected: "border-destructive/40 bg-destructive/10 text-destructive",
		merged: "border-sky-400/40 bg-sky-500/10 text-sky-200",
	};
	const cls = styles[status] ?? styles.draft;
	return (
		<span
			className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${cls}`}
		>
			{status}
		</span>
	);
}

"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { DraftChangeSet } from "#/components/editor/draft-change-set";
import type { ParsedDraftContextBundle } from "#/server/memgraph/types";

export interface DraftContextBannerProps {
	bundle: ParsedDraftContextBundle | null;
	title: string;
	summary: string;
	currentCatalogRevision: string | null;
	readOnly: boolean;
	onTitleChange: (value: string) => void;
	onSummaryChange: (value: string) => void;
	onRebase?: () => void;
	selectedDocumentId?: string | null;
	onSelectDocument?: (id: string) => void;
}

export function DraftContextBanner({
	bundle,
	title,
	summary,
	currentCatalogRevision,
	readOnly,
	onTitleChange,
	onSummaryChange,
	onRebase,
	selectedDocumentId,
	onSelectDocument,
}: DraftContextBannerProps) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [summaryOpen, setSummaryOpen] = useState(summary.trim().length > 0);
	const status = bundle?.context.status ?? "draft";
	const pinned = bundle?.context.baseCatalogRevision ?? null;
	const stale =
		pinned != null &&
		currentCatalogRevision != null &&
		pinned !== currentCatalogRevision;
	const counts = {
		added:
			bundle?.documentChanges.filter((c) => c.operation === "create").length ?? 0,
		updated:
			bundle?.documentChanges.filter((c) => c.operation === "update").length ?? 0,
		deleted:
			bundle?.documentChanges.filter((c) => c.operation === "delete").length ?? 0,
	};

	return (
		<section
			className="sticky top-0 z-20 space-y-3 border-b border-primary/30 bg-background/95 p-4 backdrop-blur"
			data-proposal-status={status}
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Context title
					</label>
					<input
						className="w-full rounded-md border bg-background px-3 py-2 text-lg font-semibold"
						value={title}
						onChange={(event) => onTitleChange(event.target.value)}
						disabled={readOnly}
						placeholder="Draft context title"
					/>
				</div>
				<span className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide">
					{status}
				</span>
			</div>

			<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
				<span>
					Pinned revision: <code className="font-mono">{pinned ?? "—"}</code>
				</span>
				<span>
					{counts.added} added · {counts.updated} updated · {counts.deleted}{" "}
					deleted
				</span>
				<span>
					Validation: {bundle?.context.validationState ?? "unknown"}
				</span>
				{bundle?.context.prUrl ? (
					<a
						href={bundle.context.prUrl}
						target="_blank"
						rel="noreferrer"
						className="underline"
					>
						PR #{bundle.context.prNumber}
					</a>
				) : null}
				<button
					type="button"
					className="rounded-md border px-2 py-1"
					onClick={() => setSummaryOpen((v) => !v)}
				>
					{summaryOpen ? "Hide summary" : "Edit summary"}
				</button>
				<button
					type="button"
					className="rounded-md border px-2 py-1"
					onClick={() => setDrawerOpen((v) => !v)}
				>
					{drawerOpen ? "Hide changes" : "Changes"}
				</button>
			</div>

			{stale ? (
				<div className="rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
					<p>
						Pinned catalog revision is stale (current{" "}
						<code className="font-mono">{currentCatalogRevision}</code>).
					</p>
					{!readOnly && onRebase ? (
						<button
							type="button"
							className="mt-2 rounded-md border px-2 py-1 text-xs"
							onClick={onRebase}
						>
							Rebase pin to current catalog
						</button>
					) : null}
				</div>
			) : null}

			{summaryOpen ? (
				<label className="grid gap-1 text-sm">
					<span className="text-xs uppercase text-muted-foreground">Summary</span>
					<textarea
						className="min-h-20 rounded-md border bg-background px-3 py-2"
						value={summary}
						onChange={(event) => onSummaryChange(event.target.value)}
						disabled={readOnly}
					/>
				</label>
			) : null}

			{bundle?.context.rejectReason ? (
				<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					Rejected: {bundle.context.rejectReason}
				</p>
			) : null}

			{bundle ? (
				<p className="text-xs text-muted-foreground">
					Author: @{bundle.context.authorLogin}
					{bundle.context.moderatorLogin
						? ` · Moderator: @${bundle.context.moderatorLogin}`
						: ""}
				</p>
			) : (
				<p className="text-xs text-muted-foreground">
					New context — not yet saved.{" "}
					<Link to="/edit" className="underline">
						← Back to drafts
					</Link>
				</p>
			)}

			{drawerOpen && bundle ? (
				<DraftChangeSet
					bundle={bundle}
					selectedId={selectedDocumentId}
					onSelect={onSelectDocument}
				/>
			) : null}
		</section>
	);
}

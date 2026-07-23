import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { DraftChangeSet } from "#/components/editor/draft-change-set";
import { approveDraftFn, rejectDraftFn } from "#/server/drafts";
import { loadModerationPageFn } from "#/server/moderation";

export const Route = createFileRoute("/_edit/moderation/")({
	loader: async () => {
		return loadModerationPageFn();
	},
	component: ModerationPage,
});

function ModerationPage() {
	const router = useRouter();
	const { queue, canModerate, currentCatalogRevision } = Route.useLoaderData();
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [documentNotes, setDocumentNotes] = useState<Record<string, string>>({});

	async function onApprove(id: string, stale: boolean) {
		if (stale) {
			setError("stale-base-revision: author must rebase before approval");
			return;
		}
		setBusyId(id);
		setError(null);
		try {
			await approveDraftFn({ data: { id } });
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Approve failed");
		} finally {
			setBusyId(null);
		}
	}

	async function onReject(id: string) {
		const reason = prompt("Rejection reason")?.trim();
		if (!reason) return;
		setBusyId(id);
		setError(null);
		try {
			const notes = Object.entries(documentNotes)
				.filter(([changeId, note]) => note.trim() && changeId.startsWith(id) === false)
				.map(([documentChangeId, note]) => ({ documentChangeId, note }));
			const scopedNotes = Object.entries(documentNotes)
				.filter(([, note]) => note.trim())
				.map(([documentChangeId, note]) => ({ documentChangeId, note }));
			await rejectDraftFn({
				data: {
					id,
					reason,
					documentNotes: scopedNotes.length ? scopedNotes : notes,
				},
			});
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Reject failed");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">OpenSpec change moderation</h1>
				<Link to="/edit" className="text-sm underline">
					← My drafts
				</Link>
			</div>

			{error ? (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			) : null}

			{canModerate ? (
				queue.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No draft contexts awaiting review.
					</p>
				) : (
					<ul className="divide-y rounded-lg border">
						{queue.map((bundle) => {
							const stale =
								bundle.context.baseCatalogRevision !== currentCatalogRevision;
							return (
								<li key={bundle.context.id} className="space-y-3 px-4 py-4">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h2 className="font-medium">{bundle.context.title}</h2>
											<p className="text-xs text-muted-foreground">
												@{bundle.context.authorLogin} · pin{" "}
												<code className="font-mono">
													{bundle.context.baseCatalogRevision}
												</code>{" "}
												· {bundle.documentChanges.length} documents
											</p>
											{bundle.context.summary ? (
												<p className="mt-2 text-sm">{bundle.context.summary}</p>
											) : null}
											{stale ? (
												<p className="mt-2 text-sm text-amber-200">
													Stale catalog pin — approval blocked until rebase.
												</p>
											) : null}
										</div>
										<div className="flex shrink-0 flex-col gap-2">
											<button
												type="button"
												className="rounded-md border px-3 py-1.5 text-sm"
												onClick={() =>
													setExpandedId((current) =>
														current === bundle.context.id
															? null
															: bundle.context.id,
													)
												}
											>
												{expandedId === bundle.context.id
													? "Hide changes"
													: "Review changes"}
											</button>
											<button
												type="button"
												className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
												disabled={busyId === bundle.context.id || stale}
												onClick={() =>
													void onApprove(bundle.context.id, stale)
												}
											>
												Approve & open PR
											</button>
											<button
												type="button"
												className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
												disabled={busyId === bundle.context.id}
												onClick={() => void onReject(bundle.context.id)}
											>
												Reject
											</button>
										</div>
									</div>
									{expandedId === bundle.context.id ? (
										<DraftChangeSet
											bundle={bundle}
											showModeratorNotes
											documentNotes={documentNotes}
											onDocumentNoteChange={(documentChangeId, note) =>
												setDocumentNotes((current) => ({
													...current,
													[documentChangeId]: note,
												}))
											}
										/>
									) : null}
								</li>
							);
						})}
					</ul>
				)
			) : null}
		</div>
	);
}

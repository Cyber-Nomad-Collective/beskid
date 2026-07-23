import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DraftContextBanner } from "#/components/editor/draft-context-banner";
import { DraftDocumentWizard } from "#/components/editor/draft-document-wizard";
import { OpenSpecMarkdownEditor } from "#/components/editor/open-spec-markdown-editor";
import { TrackerTaskEmbed } from "#/components/reader/tracker-task-embed";
import {
	addDraftDocumentFn,
	createDraftContextFn,
	deleteDraftFn,
	getDraftFn,
	removeDraftDocumentFn,
	submitDraftFn,
	updateDraftContextFn,
	updateDraftDocumentFn,
} from "#/server/drafts";

export const Route = createFileRoute("/_edit/edit/drafts/$id")({
	validateSearch: (search: Record<string, unknown>) => ({
		capability:
			typeof search.capability === "string" ? search.capability : undefined,
		domain: typeof search.domain === "string" ? search.domain : undefined,
		area: typeof search.area === "string" ? search.area : undefined,
		feature: typeof search.feature === "string" ? search.feature : undefined,
	}),
	loader: async ({ params }) => {
		const { loadDraftEditorCatalogFn } = await import(
			"#/server/draft-editor"
		);
		const catalog = await loadDraftEditorCatalogFn();
		if (params.id === "new") {
			return {
				draft: null,
				currentCatalogRevision: catalog.currentCatalogRevision,
			};
		}
		return {
			draft: await getDraftFn({ data: { id: params.id } }),
			currentCatalogRevision: catalog.currentCatalogRevision,
		};
	},
	component: DraftContextEditorPage,
});

function DraftContextEditorPage() {
	const router = useRouter();
	const { id } = Route.useParams();
	const search = Route.useSearch();
	const { draft, currentCatalogRevision } = Route.useLoaderData();
	const isNew = id === "new";

	const [bundle, setBundle] = useState(draft);
	const [title, setTitle] = useState(draft?.context.title ?? "");
	const [summary, setSummary] = useState(draft?.context.summary ?? "");
	const [selectedId, setSelectedId] = useState<string | null>(
		draft?.documentChanges[0]?.id ?? null,
	);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [prefillApplied, setPrefillApplied] = useState(false);

	const readOnly =
		!isNew &&
		bundle != null &&
		bundle.context.status !== "draft" &&
		bundle.context.status !== "rejected";

	useEffect(() => {
		if (prefillApplied || readOnly) return;
		const capability = search.capability;
		const domain = search.domain;
		const area = search.area;
		const feature = search.feature;
		if (!capability && !(domain && area && feature)) return;
		setPrefillApplied(true);
		void (async () => {
			try {
				const current = await ensureContext();
				const identity =
					domain && area && feature
						? {
								kind: "feature" as const,
								domain,
								area,
								feature,
							}
						: {
								kind: "feature" as const,
								domain: (capability ?? "").split("--")[0] ?? "language",
								area: (capability ?? "").split("--")[1] ?? "syntax",
								feature: (capability ?? "").split("--")[2] ?? "blocks",
							};
				const updated = await addDraftDocumentFn({
					data: {
						contextId: current.context.id,
						operation: "update",
						identity,
					},
				});
				setBundle(updated);
				setSelectedId(updated.documentChanges.at(-1)?.id ?? null);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Could not prefill proposal",
				);
			}
		})();
	}, [prefillApplied, readOnly, search.area, search.capability, search.domain, search.feature]);

	const selected =
		bundle?.documentChanges.find((change) => change.id === selectedId) ?? null;

	async function ensureContext() {
		if (bundle) return bundle;
		const created = await createDraftContextFn({
			data: { title: title || "Untitled draft context", summary },
		});
		setBundle(created);
		await router.navigate({
			to: "/edit/drafts/$id",
			params: { id: created.context.id },
			replace: true,
		});
		return created;
	}

	async function onSaveMeta() {
		setBusy(true);
		setError(null);
		try {
			const current = await ensureContext();
			const updated = await updateDraftContextFn({
				data: { id: current.context.id, title, summary },
			});
			setBundle(updated);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	}

	async function onSaveDocument(markdown: string) {
		if (!bundle || !selected || readOnly) return;
		setBusy(true);
		setError(null);
		try {
			const updated = await updateDraftDocumentFn({
				data: {
					contextId: bundle.context.id,
					documentChangeId: selected.id,
					sourceMarkdown: markdown,
				},
			});
			setBundle(updated);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	}

	async function onSubmit() {
		if (!bundle) return;
		setBusy(true);
		setError(null);
		try {
			await updateDraftContextFn({
				data: { id: bundle.context.id, title, summary },
			});
			await submitDraftFn({ data: { id: bundle.context.id } });
			await router.navigate({ to: "/edit" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Submit failed");
		} finally {
			setBusy(false);
		}
	}

	async function onDelete() {
		if (!bundle || !confirm("Delete this draft context?")) return;
		setBusy(true);
		try {
			await deleteDraftFn({ data: { id: bundle.context.id } });
			await router.navigate({ to: "/edit" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed");
		} finally {
			setBusy(false);
		}
	}

	const standardId =
		selected?.identity.key ??
		search.capability ??
		(search.domain && search.area && search.feature
			? `${search.domain}--${search.area}--${search.feature}`
			: "");

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<DraftContextBanner
				bundle={bundle}
				title={title}
				summary={summary}
				currentCatalogRevision={currentCatalogRevision}
				readOnly={readOnly}
				onTitleChange={setTitle}
				onSummaryChange={setSummary}
				selectedDocumentId={selectedId}
				onSelectDocument={setSelectedId}
				onRebase={() => {
					if (!bundle) return;
					void updateDraftContextFn({
						data: { id: bundle.context.id, rebaseToCurrentCatalog: true },
					}).then(setBundle);
				}}
			/>

			{error ? (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			) : null}

			{!readOnly ? (
				<DraftDocumentWizard
					disabled={busy}
					onResolved={async ({ operation, identity, sourceMarkdown }) => {
						const current = await ensureContext();
						const updated = await addDraftDocumentFn({
							data: {
								contextId: current.context.id,
								operation,
								identity,
								sourceMarkdown,
							},
						});
						setBundle(updated);
						const last = updated.documentChanges.at(-1);
						if (last) setSelectedId(last.id);
					}}
				/>
			) : null}

			{selected ? (
				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<code className="font-mono text-xs">{selected.canonicalPath}</code>
						{!readOnly ? (
							<button
								type="button"
								className="rounded-md border border-destructive px-2 py-1 text-xs text-destructive"
								onClick={() => {
									if (!bundle) return;
									void removeDraftDocumentFn({
										data: {
											contextId: bundle.context.id,
											documentChangeId: selected.id,
										},
									}).then((updated) => {
										setBundle(updated);
										setSelectedId(updated.documentChanges[0]?.id ?? null);
									});
								}}
							>
								Remove document
							</button>
						) : null}
					</div>
					<OpenSpecMarkdownEditor
						value={selected.sourceMarkdown}
						readOnly={readOnly}
						title={selected.identity.key}
						onChange={(markdown) => void onSaveDocument(markdown)}
					/>
				</div>
			) : (
				<p className="text-sm text-muted-foreground">
					Add a document change to begin editing.
				</p>
			)}

			{standardId ? (
				<TrackerTaskEmbed
					standardId={standardId}
					catalogRevision={
						bundle?.context.baseCatalogRevision ?? currentCatalogRevision
					}
				/>
			) : null}

			<div className="flex flex-wrap gap-2">
				{!readOnly ? (
					<button
						type="button"
						className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
						onClick={() => void onSaveMeta()}
						disabled={busy}
					>
						{busy ? "Saving…" : "Save context"}
					</button>
				) : null}
				{bundle && bundle.context.status === "draft" ? (
					<button
						type="button"
						className="rounded-md border px-4 py-2 text-sm"
						onClick={() => void onSubmit()}
						disabled={busy}
					>
						Submit for review
					</button>
				) : null}
				{bundle &&
				(bundle.context.status === "draft" ||
					bundle.context.status === "rejected") ? (
					<button
						type="button"
						className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive"
						onClick={() => void onDelete()}
						disabled={busy}
					>
						Delete
					</button>
				) : null}
			</div>
		</div>
	);
}

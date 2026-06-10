import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { DraftLayoutEditor } from "#/components/editor/draft-layout-editor";
import {
	SpecCommentsPanel,
	SpecContentEditor,
	type SpecCommentItem,
} from "@beskid/ui-react/platform-spec";

import {
	createDraftFn,
	deleteDraftFn,
	getDraftFn,
	submitDraftFn,
	updateDraftFn,
} from "#/server/drafts";
import type { DraftChangeKind, SpecLevel } from "#/server/memgraph/types";

export const Route = createFileRoute("/_edit/edit/drafts/$id")({
	loader: async ({ params }) => {
		if (params.id === "new") {
			return { draft: null };
		}
		return { draft: await getDraftFn({ data: { id: params.id } }) };
	},
	component: DraftEditorPage,
});

function DraftEditorPage() {
	const router = useRouter();
	const { id } = Route.useParams();
	const { draft } = Route.useLoaderData();
	const isNew = id === "new";

	const [title, setTitle] = useState(draft?.title ?? "");
	const [summary, setSummary] = useState(draft?.summary ?? "");
	const [specLevel, setSpecLevel] = useState<SpecLevel>(
		draft?.specLevel ?? "article",
	);
	const [changeKind, setChangeKind] = useState<DraftChangeKind>(
		draft?.changeKind ?? "create",
	);
	const [parentSlug, setParentSlug] = useState("platform-spec");
	const [leafSlug, setLeafSlug] = useState("new-doc");
	const [bodyMd, setBodyMd] = useState(draft?.bodyMd ?? "");
	const [layoutJson, setLayoutJson] = useState(draft?.layoutJson ?? "");
	const [comments, setComments] = useState<SpecCommentItem[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const readOnly =
		!isNew && draft != null && draft.status !== "draft" && draft.status !== "rejected";

	async function onSave() {
		setBusy(true);
		setError(null);
		try {
			const values = {
				parent_slug: parentSlug,
				leaf_slug: leafSlug,
				body_md: bodyMd,
				layout_json: layoutJson,
				title,
			};

			if (isNew) {
				const created = await createDraftFn({
					data: {
						title,
						summary,
						changeKind,
						specLevel,
						values,
					},
				});
				await router.navigate({
					to: "/edit/drafts/$id",
					params: { id: created.id },
				});
			} else {
				await updateDraftFn({
					data: {
						id,
						title,
						summary,
						changeKind,
						specLevel,
						values,
					},
				});
				await router.invalidate();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	}

	async function onSubmit() {
		setBusy(true);
		setError(null);
		try {
			await submitDraftFn({ data: { id } });
			await router.navigate({ to: "/edit" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Submit failed");
		} finally {
			setBusy(false);
		}
	}

	async function onDelete() {
		if (!confirm("Delete this draft?")) return;
		setBusy(true);
		setError(null);
		try {
			await deleteDraftFn({ data: { id } });
			await router.navigate({ to: "/edit" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">
					{isNew ? "New draft" : draft?.title ?? "Draft"}
				</h1>
				<Link to="/edit" className="text-sm underline">
					← Back to drafts
				</Link>
			</div>

			{draft?.status ? (
				<p className="text-sm text-muted-foreground">
					Status: <strong>{draft.status}</strong>
					{draft.prUrl ? (
						<>
							{" · "}
							<a href={draft.prUrl} className="underline" target="_blank" rel="noreferrer">
								PR #{draft.prNumber}
							</a>
						</>
					) : null}
					{draft.rejectReason ? (
						<> · Rejected: {draft.rejectReason}</>
					) : null}
				</p>
			) : null}

			{error ? (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			) : null}

			<div className="grid gap-4">
				<label className="grid gap-1 text-sm">
					<span>Title</span>
					<input
						className="rounded-md border px-3 py-2"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						disabled={readOnly}
					/>
				</label>
				<label className="grid gap-1 text-sm">
					<span>Summary</span>
					<textarea
						className="min-h-20 rounded-md border px-3 py-2"
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						disabled={readOnly}
					/>
				</label>
				<div className="grid grid-cols-2 gap-4">
					<label className="grid gap-1 text-sm">
						<span>Spec level</span>
						<select
							className="rounded-md border px-3 py-2"
							value={specLevel}
							onChange={(e) => setSpecLevel(e.target.value as SpecLevel)}
							disabled={readOnly}
						>
							{["domain", "area", "feature", "article", "adr"].map((level) => (
								<option key={level} value={level}>
									{level}
								</option>
							))}
						</select>
					</label>
					<label className="grid gap-1 text-sm">
						<span>Change kind</span>
						<select
							className="rounded-md border px-3 py-2"
							value={changeKind}
							onChange={(e) => setChangeKind(e.target.value as DraftChangeKind)}
							disabled={readOnly}
						>
							{["create", "update", "delete"].map((kind) => (
								<option key={kind} value={kind}>
									{kind}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<label className="grid gap-1 text-sm">
						<span>Parent slug</span>
						<input
							className="rounded-md border px-3 py-2 font-mono text-xs"
							value={parentSlug}
							onChange={(e) => setParentSlug(e.target.value)}
							disabled={readOnly}
						/>
					</label>
					<label className="grid gap-1 text-sm">
						<span>Leaf slug</span>
						<input
							className="rounded-md border px-3 py-2 font-mono text-xs"
							value={leafSlug}
							onChange={(e) => setLeafSlug(e.target.value)}
							disabled={readOnly}
						/>
					</label>
				</div>
				<label className="grid gap-1 text-sm">
					<span>Layout</span>
					<DraftLayoutEditor
						layoutJson={layoutJson || null}
						onChange={setLayoutJson}
						disabled={readOnly}
					/>
				</label>
				<div className="grid gap-1 text-sm">
					<span>Content</span>
					<SpecContentEditor
						bodyMd={bodyMd}
						onChange={setBodyMd}
						disabled={readOnly}
					/>
				</div>
				<SpecCommentsPanel
					comments={comments}
					onChange={setComments}
					disabled={readOnly}
				/>
			</div>

			<div className="flex flex-wrap gap-2">
				{!readOnly ? (
					<button
						type="button"
						className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
						onClick={() => void onSave()}
						disabled={busy}
					>
						{busy ? "Saving…" : "Save draft"}
					</button>
				) : null}
				{!isNew && draft?.status === "draft" ? (
					<button
						type="button"
						className="rounded-md border px-4 py-2 text-sm"
						onClick={() => void onSubmit()}
						disabled={busy}
					>
						Submit for review
					</button>
				) : null}
				{!isNew && (draft?.status === "draft" || draft?.status === "rejected") ? (
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

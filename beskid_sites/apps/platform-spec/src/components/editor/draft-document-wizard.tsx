"use client";

import { useState } from "react";

import type { SpecArtifactKind } from "#/lib/spec/document-identity";
import { resolveDraftIdentityFn } from "#/server/drafts";
import type { DraftDocumentOperation } from "#/server/memgraph/types";

export interface DraftDocumentWizardProps {
	disabled?: boolean;
	onResolved: (input: {
		operation: DraftDocumentOperation;
		identity: {
			kind: SpecArtifactKind;
			domain: string;
			area?: string;
			feature?: string;
			article?: string;
			decision?: string;
		};
		sourceMarkdown: string;
		layoutId: string;
	}) => Promise<void> | void;
}

const KINDS: SpecArtifactKind[] = [
	"domain",
	"area",
	"feature",
	"article",
	"decision",
];

export function DraftDocumentWizard({
	disabled,
	onResolved,
}: DraftDocumentWizardProps) {
	const [operation, setOperation] = useState<DraftDocumentOperation>("create");
	const [kind, setKind] = useState<SpecArtifactKind>("feature");
	const [domain, setDomain] = useState("language");
	const [area, setArea] = useState("syntax");
	const [feature, setFeature] = useState("blocks");
	const [article, setArticle] = useState("notes");
	const [decision, setDecision] = useState("0001-shape");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onAdd() {
		setBusy(true);
		setError(null);
		try {
			const identityInput =
				kind === "domain"
					? { kind, domain }
					: kind === "area"
						? { kind, domain, area }
						: kind === "feature"
							? { kind, domain, area, feature }
							: kind === "article"
								? { kind, domain, area, feature, article }
								: { kind, domain, area, feature, decision };

			const resolved = await resolveDraftIdentityFn({
				data: { identity: identityInput },
			});
			await onResolved({
				operation,
				identity: identityInput,
				sourceMarkdown: resolved.templateMarkdown,
				layoutId: resolved.layoutId,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not resolve identity");
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="space-y-3 rounded-lg border p-4">
			<h2 className="text-sm font-semibold">Add document change</h2>
			<div className="grid gap-3 sm:grid-cols-2">
				<label className="grid gap-1 text-sm">
					<span>Operation</span>
					<select
						className="rounded-md border bg-background px-2 py-1.5"
						value={operation}
						disabled={disabled || busy}
						onChange={(event) =>
							setOperation(event.target.value as DraftDocumentOperation)
						}
					>
						<option value="create">create</option>
						<option value="update">update</option>
						<option value="delete">delete</option>
					</select>
				</label>
				<label className="grid gap-1 text-sm">
					<span>Artifact kind</span>
					<select
						className="rounded-md border bg-background px-2 py-1.5"
						value={kind}
						disabled={disabled || busy}
						onChange={(event) => setKind(event.target.value as SpecArtifactKind)}
					>
						{KINDS.map((entry) => (
							<option key={entry} value={entry}>
								{entry}
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-1 text-sm">
					<span>Domain</span>
					<input
						className="rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
						value={domain}
						disabled={disabled || busy}
						onChange={(event) => setDomain(event.target.value)}
					/>
				</label>
				{kind !== "domain" ? (
					<label className="grid gap-1 text-sm">
						<span>Area</span>
						<input
							className="rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
							value={area}
							disabled={disabled || busy}
							onChange={(event) => setArea(event.target.value)}
						/>
					</label>
				) : null}
				{kind === "feature" || kind === "article" || kind === "decision" ? (
					<label className="grid gap-1 text-sm">
						<span>Feature</span>
						<input
							className="rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
							value={feature}
							disabled={disabled || busy}
							onChange={(event) => setFeature(event.target.value)}
						/>
					</label>
				) : null}
				{kind === "article" ? (
					<label className="grid gap-1 text-sm">
						<span>Article</span>
						<input
							className="rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
							value={article}
							disabled={disabled || busy}
							onChange={(event) => setArticle(event.target.value)}
						/>
					</label>
				) : null}
				{kind === "decision" ? (
					<label className="grid gap-1 text-sm">
						<span>Decision</span>
						<input
							className="rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
							value={decision}
							disabled={disabled || busy}
							onChange={(event) => setDecision(event.target.value)}
						/>
					</label>
				) : null}
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			<button
				type="button"
				className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
				disabled={disabled || busy}
				onClick={() => void onAdd()}
			>
				{busy ? "Resolving…" : "Add to context"}
			</button>
		</section>
	);
}

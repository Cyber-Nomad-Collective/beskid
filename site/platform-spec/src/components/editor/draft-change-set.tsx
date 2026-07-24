"use client";

import type { ParsedDraftContextBundle } from "#/server/memgraph/types";

export interface DraftChangeSetProps {
	bundle: ParsedDraftContextBundle;
	selectedId?: string | null;
	onSelect?: (documentChangeId: string) => void;
	showModeratorNotes?: boolean;
	documentNotes?: Record<string, string>;
	onDocumentNoteChange?: (documentChangeId: string, note: string) => void;
}

function unifiedDiff(base: string | null, next: string): string {
	if (base == null) {
		return next
			.split("\n")
			.map((line) => `+ ${line}`)
			.join("\n");
	}
	const left = base.split("\n");
	const right = next.split("\n");
	const max = Math.max(left.length, right.length);
	const lines: string[] = [];
	for (let i = 0; i < max; i += 1) {
		const a = left[i];
		const b = right[i];
		if (a === b) {
			if (a !== undefined) lines.push(`  ${a}`);
		} else {
			if (a !== undefined) lines.push(`- ${a}`);
			if (b !== undefined) lines.push(`+ ${b}`);
		}
	}
	return lines.join("\n");
}

export function DraftChangeSet({
	bundle,
	selectedId,
	onSelect,
	showModeratorNotes = false,
	documentNotes = {},
	onDocumentNoteChange,
}: DraftChangeSetProps) {
	const counts = {
		added: bundle.documentChanges.filter((c) => c.operation === "create").length,
		updated: bundle.documentChanges.filter((c) => c.operation === "update")
			.length,
		deleted: bundle.documentChanges.filter((c) => c.operation === "delete")
			.length,
	};

	return (
		<section className="space-y-3" aria-label="Change set">
			<p className="text-xs text-muted-foreground">
				{counts.added} added · {counts.updated} updated · {counts.deleted} deleted
			</p>
			<ul className="divide-y rounded-lg border">
				{bundle.documentChanges.map((change) => {
					const selected = selectedId === change.id;
					return (
						<li key={change.id} className="space-y-2 p-3">
							<button
								type="button"
								className={`w-full text-left ${selected ? "font-semibold" : ""}`}
								onClick={() => onSelect?.(change.id)}
							>
								<span className="mr-2 rounded border px-1.5 py-0.5 text-[10px] uppercase">
									{change.operation}
								</span>
								<code className="font-mono text-xs">{change.canonicalPath}</code>
							</button>
							{change.validation.issues.length > 0 ? (
								<ul className="space-y-1 text-xs">
									{change.validation.issues.map((issue) => (
										<li
											key={`${change.id}-${issue.code}-${issue.message}`}
											className={
												issue.severity === "error" ? "text-destructive" : "text-amber-300"
											}
										>
											{issue.code}: {issue.message}
										</li>
									))}
								</ul>
							) : null}
							{selected ? (
								<pre className="max-h-64 overflow-auto rounded-md border bg-muted/20 p-2 text-[11px] leading-relaxed">
									{unifiedDiff(change.baseMarkdown, change.sourceMarkdown)}
								</pre>
							) : null}
							{change.moderatorNote ? (
								<p className="text-xs text-amber-200">
									Moderator: {change.moderatorNote}
								</p>
							) : null}
							{showModeratorNotes ? (
								<label className="grid gap-1 text-xs">
									<span>Note for author</span>
									<textarea
										className="min-h-16 rounded-md border bg-background px-2 py-1"
										value={documentNotes[change.id] ?? ""}
										onChange={(event) =>
											onDocumentNoteChange?.(change.id, event.target.value)
										}
									/>
								</label>
							) : null}
						</li>
					);
				})}
			</ul>
		</section>
	);
}

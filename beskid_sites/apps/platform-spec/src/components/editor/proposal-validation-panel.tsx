"use client";

import { useEffect, useState } from "react";

export interface ProposalValidationPanelProps {
	title: string;
	capability: string;
	bodyMd: string;
}

export interface ValidationIssue {
	code: string;
	severity: "error" | "warning";
	message: string;
}

/**
 * Lightweight preflight for the OpenSpec capability delta produced by this editor.
 * The repository OpenSpec CLI remains the authoritative validation gate.
 */
export function ProposalValidationPanel({
	title,
	capability,
	bodyMd,
}: ProposalValidationPanelProps) {
	const [issues, setIssues] = useState<ValidationIssue[]>([]);
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		setDirty(true);
		const handle = setTimeout(() => {
			const next: ValidationIssue[] = [];

			const normalizedBody = bodyMd.trim();
			if (normalizedBody.length === 0) {
				next.push({
					code: "stub-content",
					severity: "warning",
					message: "Body is empty.",
				});
			} else if (!/^### Requirement:/m.test(normalizedBody)) {
				next.push({
					code: "generated-requirement",
					severity: "warning",
					message:
						"The editor will wrap this prose in a generated Requirement and Scenario. Add explicit OpenSpec headings for precise normative text.",
				});
			}
			if (
				!/^[a-z0-9]+(?:-+[a-z0-9]+)*(?:--[a-z0-9]+(?:-+[a-z0-9]+)*)+$/.test(
					capability,
				)
			) {
				next.push({
					code: "invalid-capability",
					severity: "error",
					message: "Capability must use segments such as language--syntax--blocks.",
				});
			}

			/** Title presence. */
			if (!title.trim()) {
				next.push({
					code: "missing-title",
					severity: "error",
					message: "Title is required.",
				});
			}

			setIssues(next);
			setDirty(false);
		}, 350);

		return () => clearTimeout(handle);
	}, [title, capability, bodyMd]);

	const errors = issues.filter((i) => i.severity === "error");
	const warnings = issues.filter((i) => i.severity === "warning");

	return (
		<section className="proposal-validation-panel rounded-lg border bg-card p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-sm font-semibold">Validation</h3>
				<span className="flex items-center gap-3 text-xs text-muted-foreground">
					{dirty ? (
						<span>Checking…</span>
					) : errors.length === 0 && warnings.length === 0 ? (
						<span className="text-emerald-400">All checks passed</span>
					) : (
						<>
							<span className="text-destructive">
								{errors.length} error{errors.length === 1 ? "" : "s"}
							</span>
							<span className="text-amber-400">
								{warnings.length} warning{warnings.length === 1 ? "" : "s"}
							</span>
						</>
					)}
				</span>
			</div>

			{issues.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					The draft is ready for repository OpenSpec validation.
				</p>
			) : (
				<ul className="space-y-1.5 text-sm">
					{issues.map((issue) => (
						<li
							key={issue.code}
							className={`flex items-start gap-2 rounded-md px-2 py-1 ${
								issue.severity === "error"
									? "bg-destructive/5 text-destructive"
									: "bg-amber-500/5 text-amber-300"
							}`}
						>
							<span className="mt-0.5 text-xs font-bold uppercase">
								{issue.severity === "error" ? "ERR" : "WRN"}
							</span>
							<span className="flex-1">
								<code className="mr-2 font-mono text-xs text-muted-foreground">
									{issue.code}
								</code>
								{issue.message}
							</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { validateFrontmatterForLevel } from "@cyber-nomad-collective/spec-core";
import type { SpecLevel } from "#/server/memgraph/types";

export interface ProposalValidationPanelProps {
	/** Debounced content + frontmatter state from the editor. */
	specLevel: SpecLevel;
	title: string;
	description: string;
	ownerName: string;
	ownerEmail: string;
	bodyMd: string;
}

export interface ValidationIssue {
	code: string;
	severity: "error" | "warning";
	message: string;
}

/**
 * Realtime spec doc validation panel. Re-runs spec-core frontmatter validation
 * (debounced) on every content change and surfaces issues inline.
 *
 * Replaces the trudoc validation role: validators now run client-side in the
 * React app, giving authors immediate feedback as they edit.
 */
export function ProposalValidationPanel({
	specLevel,
	title,
	description,
	ownerName,
	ownerEmail,
	bodyMd,
}: ProposalValidationPanelProps) {
	const [issues, setIssues] = useState<ValidationIssue[]>([]);
	const [dirty, setDirty] = useState(false);

	/** Debounce validation 350ms after the last keystroke. */
	const fingerprint = useMemo(
		() => `${specLevel}|${title}|${description}|${ownerName}|${ownerEmail}|${bodyMd.length}`,
		[specLevel, title, description, ownerName, ownerEmail, bodyMd.length],
	);

	useEffect(() => {
		setDirty(true);
		const handle = setTimeout(() => {
			const next: ValidationIssue[] = [];

			/** Frontmatter validation (ported to spec-core, runs client-side). */
			const fmCheck = validateFrontmatterForLevel(specLevel, {
				title: title.trim() || undefined,
				description: description.trim() || undefined,
				specLevel,
				owner: {
					name: ownerName.trim() || undefined,
					email: ownerEmail.trim() || undefined,
				} as any,
				submitter: {
					name: ownerName.trim() || undefined,
					email: ownerEmail.trim() || undefined,
				} as any,
				status: "Proposed",
			} as Record<string, unknown>);

			if (!fmCheck.ok) {
				for (const message of fmCheck.errors) {
					const severity: ValidationIssue["severity"] =
						message.includes("owner:") ||
						message.includes("submitter:") ||
						message.includes("status:")
							? "warning"
							: "error";
					next.push({ code: "invalid-frontmatter", severity, message });
				}
			}

			/** Stub-content check (mirrors spec-core's validateStubContent). */
			const MIN_BODY_CHARS = specLevel === "article" || specLevel === "adr" ? 240 : 480;
			const normalizedBody = bodyMd.trim();
			if (normalizedBody.length === 0) {
				next.push({
					code: "stub-content",
					severity: "warning",
					message: "Body is empty.",
				});
			} else if (normalizedBody.length < MIN_BODY_CHARS) {
				next.push({
					code: "stub-content",
					severity: "warning",
					message: `Body is only ${normalizedBody.length} chars (minimum ${MIN_BODY_CHARS} for ${specLevel}). Expand or set status: Proposed.`,
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
	}, [fingerprint, specLevel, title, description, ownerName, ownerEmail, bodyMd]);

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
							<span className="text-destructive">{errors.length} error{errors.length === 1 ? "" : "s"}</span>
							<span className="text-amber-400">{warnings.length} warning{warnings.length === 1 ? "" : "s"}</span>
						</>
					)}
				</span>
			</div>

			{issues.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					Frontmatter and body content meet the minimum contract for {specLevel} nodes.
				</p>
			) : (
				<ul className="space-y-1.5 text-sm">
					{issues.map((issue, idx) => (
						<li
							key={`${issue.code}-${idx}`}
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
								<code className="mr-2 font-mono text-xs text-muted-foreground">{issue.code}</code>
								{issue.message}
							</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

import type { SpecDocumentIdentity } from "#/lib/spec/document-identity";
import {
	type LayoutRegistry,
	resolveLayout,
	type SpecLayout,
	validateLayout,
} from "#/lib/spec/layouts-pure";
import type {
	DraftValidationIssue,
	DraftValidationResult,
	ParsedDraftDocumentChange,
} from "#/server/memgraph/types";

export interface DraftValidationCatalog {
	revision: string;
	paths: Set<string>;
	slugs: Set<string>;
}

function issue(
	code: string,
	severity: "error" | "warning",
	message: string,
	documentChangeId?: string,
): DraftValidationIssue {
	return { code, severity, message, documentChangeId };
}

function hasRequirementHeading(source: string): boolean {
	return /^### Requirement:\s+\S/m.test(source);
}

function hasScenarioBlock(source: string): boolean {
	return (
		/^#### Scenario:/m.test(source) &&
		/\*\*GIVEN\*\*/i.test(source) &&
		/\*\*WHEN\*\*/i.test(source) &&
		/\*\*THEN\*\*/i.test(source)
	);
}

function forbiddenMarkup(source: string): string | null {
	if (/<\s*script\b/i.test(source)) return "script";
	if (/!\[[^\]]*\]\([^)]+\)/.test(source)) return "image";
	if (/^\|.*\|$/m.test(source) && /^\|?\s*-{3,}/m.test(source)) return "table";
	return null;
}

export function layoutTemplateMarkdown(layout: SpecLayout): string {
	const lines: string[] = [`# ${layout.title}`, ""];
	for (const section of layout.sections) {
		const hashes = "#".repeat(Math.min(Math.max(section.level, 1), 6));
		lines.push(`${hashes} ${section.heading}`, "");
		if (section.heading === "Requirements") {
			lines.push(
				"### Requirement: Title",
				"The Beskid standard SHALL …",
				"",
				"#### Scenario: Example",
				"- **GIVEN** a precondition",
				"- **WHEN** an action occurs",
				"- **THEN** an observable outcome holds",
				"",
			);
		} else if (section.description) {
			lines.push(`<!-- ${section.description} -->`, "");
		} else {
			lines.push("", "");
		}
	}
	return lines.join("\n").trimEnd() + "\n";
}

export function validateDraftDocument(
	change: Pick<
		ParsedDraftDocumentChange,
		| "id"
		| "operation"
		| "identity"
		| "canonicalPath"
		| "sourceMarkdown"
		| "baseMarkdown"
		| "baseContentHash"
		| "layoutId"
	>,
	catalog: DraftValidationCatalog,
	layouts: LayoutRegistry | null,
): DraftValidationResult {
	const issues: DraftValidationIssue[] = [];
	const identity = change.identity;
	const id = change.id;

	if (
		!identity?.canonicalPath ||
		identity.canonicalPath !== change.canonicalPath
	) {
		issues.push(
			issue(
				"identity-mismatch",
				"error",
				"Document identity does not match canonical path.",
				id,
			),
		);
	}

	if (change.operation === "create" && catalog.paths.has(change.canonicalPath)) {
		issues.push(
			issue(
				"path-collision",
				"error",
				`Path already exists in catalog: ${change.canonicalPath}`,
				id,
			),
		);
	}

	if (
		(change.operation === "update" || change.operation === "delete") &&
		!catalog.paths.has(change.canonicalPath)
	) {
		issues.push(
			issue(
				"missing-base",
				"error",
				`Cannot ${change.operation} unknown document ${change.canonicalPath}`,
				id,
			),
		);
	}

	if (
		(change.operation === "update" || change.operation === "delete") &&
		!change.baseContentHash
	) {
		issues.push(
			issue(
				"missing-base-hash",
				"error",
				"Base content hash is required for update/delete operations.",
				id,
			),
		);
	}

	const forbidden = forbiddenMarkup(change.sourceMarkdown);
	if (forbidden) {
		issues.push(
			issue(
				"forbidden-markup",
				"error",
				`Source Markdown must not include ${forbidden} constructs.`,
				id,
			),
		);
	}

	if (change.operation !== "delete") {
		if (!change.sourceMarkdown.trim()) {
			issues.push(issue("empty-body", "error", "Document body is empty.", id));
		}

		const layout =
			layouts?.layouts.get(change.layoutId) ??
			(layouts ? resolveLayout(identity.specLevel, layouts) : null);
		if (layout) {
			const violations = validateLayout(change.sourceMarkdown, layout);
			for (const violation of violations) {
				issues.push(
					issue(`layout-${violation.code}`, "error", violation.message, id),
				);
			}
		}

		if (identity.artifactKind === "feature") {
			if (!hasRequirementHeading(change.sourceMarkdown)) {
				issues.push(
					issue(
						"missing-requirement",
						"error",
						"Feature documents require explicit ### Requirement: headings.",
						id,
					),
				);
			}
			if (!hasScenarioBlock(change.sourceMarkdown)) {
				issues.push(
					issue(
						"missing-scenario",
						"error",
						"Feature requirements require GIVEN/WHEN/THEN scenarios.",
						id,
					),
				);
			}
		}

		if (
			identity.authority === "informative" &&
			identity.artifactKind !== "article" &&
			identity.artifactKind !== "decision"
		) {
			issues.push(
				issue(
					"informative",
					"error",
					"Informative authority is reserved for articles and decisions.",
					id,
				),
			);
		}
	}

	return {
		ok: issues.every((entry) => entry.severity !== "error"),
		issues,
	};
}

export function validateDraftContext(
	changes: ParsedDraftDocumentChange[],
	catalog: DraftValidationCatalog,
	layouts: LayoutRegistry | null,
	baseCatalogRevision: string,
): DraftValidationResult {
	const issues: DraftValidationIssue[] = [];

	if (!baseCatalogRevision.trim()) {
		issues.push(
			issue(
				"missing-base-revision",
				"error",
				"Base catalog revision is required.",
			),
		);
	} else if (baseCatalogRevision !== catalog.revision) {
		issues.push(
			issue(
				"stale-base-revision",
				"error",
				`Pinned catalog revision ${baseCatalogRevision} does not match current ${catalog.revision}.`,
			),
		);
	}

	if (changes.length === 0) {
		issues.push(
			issue("empty-changeset", "error", "Draft context has no document changes."),
		);
	}

	const seenPaths = new Set<string>();
	for (const change of changes) {
		if (seenPaths.has(change.canonicalPath)) {
			issues.push(
				issue(
					"duplicate-path",
					"error",
					`Duplicate path in change set: ${change.canonicalPath}`,
					change.id,
				),
			);
		}
		seenPaths.add(change.canonicalPath);
		const result = validateDraftDocument(change, catalog, layouts);
		issues.push(...result.issues);
	}

	return {
		ok: issues.every((entry) => entry.severity !== "error"),
		issues,
	};
}

export function identityFromChange(
	change: ParsedDraftDocumentChange,
): SpecDocumentIdentity {
	return change.identity;
}

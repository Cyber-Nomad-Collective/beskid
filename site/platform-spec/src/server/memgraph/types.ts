import type {
	SpecArtifactKind,
	SpecDocumentIdentity,
} from "#/lib/spec/document-identity";

export type SpecLevel = "domain" | "area" | "feature" | "article" | "adr";

export type DraftDocumentOperation = "create" | "update" | "delete";

/** @deprecated Prefer DraftDocumentOperation; kept for migration mapping. */
export type DraftChangeKind = DraftDocumentOperation;

export type DraftContextStatus =
	| "draft"
	| "submitted"
	| "approved"
	| "rejected"
	| "merged"
	| "abandoned"
	| "superseded";

/** @deprecated Prefer DraftContextStatus. */
export type DraftChangeStatus = DraftContextStatus;

export type DraftValidationState = "unknown" | "valid" | "invalid";

export interface SpecDocumentNode {
	slug: string;
	repoPath: string;
	title: string;
	specLevel: SpecLevel;
	pathClass: string;
	status: string | null;
	frontmatterJson: string;
	bodyMd: string;
	layoutJson: string | null;
	contentHash: string;
	importedAt: string;
	updatedAt: string;
}

export interface DraftValidationIssue {
	code: string;
	severity: "error" | "warning";
	message: string;
	documentChangeId?: string;
}

export interface DraftValidationResult {
	ok: boolean;
	issues: DraftValidationIssue[];
}

export interface DraftDocumentChange {
	id: string;
	contextId: string;
	ordinal: number;
	operation: DraftDocumentOperation;
	artifactKind: SpecArtifactKind;
	identityJson: string;
	canonicalPath: string;
	publicSlug: string;
	layoutId: string;
	sourceMarkdown: string;
	baseMarkdown: string | null;
	baseContentHash: string | null;
	contentHash: string | null;
	moderatorNote: string | null;
	validationJson: string;
	createdAt: string;
	updatedAt: string;
}

export interface DraftContextRevision {
	id: string;
	contextId: string;
	ordinal: number;
	authorLogin: string;
	snapshotJson: string;
	createdAt: string;
}

export interface DraftContext {
	id: string;
	title: string;
	summary: string;
	baseCatalogRevision: string;
	status: DraftContextStatus;
	authorLogin: string;
	moderatorLogin: string | null;
	rejectReason: string | null;
	validationState: DraftValidationState;
	validationRevision: string | null;
	headBranch: string | null;
	prNumber: number | null;
	prUrl: string | null;
	trackerTaskIdsJson: string;
	deliveryVersionId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface DraftContextBundle {
	context: DraftContext;
	documentChanges: DraftDocumentChange[];
	revisions: DraftContextRevision[];
}

export interface ParsedDraftDocumentChange
	extends Omit<DraftDocumentChange, "identityJson" | "validationJson"> {
	identity: SpecDocumentIdentity;
	validation: DraftValidationResult;
}

export interface ParsedDraftContextBundle {
	context: DraftContext;
	documentChanges: ParsedDraftDocumentChange[];
	revisions: DraftContextRevision[];
	trackerTaskIds: string[];
}

/**
 * Legacy single-document draft shape used only during one-shot migration.
 * @deprecated
 */
export interface DraftChangeNode {
	id: string;
	title: string;
	summary: string;
	changeKind: DraftChangeKind;
	repoPath: string;
	slug: string;
	pathClass: string;
	specLevel: SpecLevel;
	frontmatterJson: string;
	bodyMd: string;
	layoutJson: string | null;
	status: DraftChangeStatus;
	authorLogin: string;
	moderatorLogin: string | null;
	rejectReason: string | null;
	headBranch: string | null;
	prNumber: number | null;
	prUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface UserNode {
	login: string;
	displayName: string | null;
	isModerator: boolean;
	createdAt: string;
	lastSeenAt: string | null;
}

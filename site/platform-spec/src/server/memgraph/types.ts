export type SpecLevel = "domain" | "area" | "feature" | "article" | "adr";

export type DraftChangeKind = "create" | "update" | "delete";

export type DraftChangeStatus =
	| "draft"
	| "submitted"
	| "approved"
	| "rejected"
	| "merged";

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

import type { RoadmapColumnId } from "#/lib/github/roadmap-labels";
import type {
	PublicBug,
	RoadmapPriority,
	SpecApprovalStatus,
} from "#/lib/github/types";
import type { SpecRelationType } from "#/lib/platform-spec/relations";
import type { VersionStatus } from "#/lib/roadmap/version-status";
import type { SeedGitSource, SeedVersion } from "#/lib/seed/schemas";

type SeedVersionCutoff = SeedVersion["cutoff"];

export type TrackerEntityType = "bug";

export type GithubSyncState = "pending" | "synced" | "conflict" | "error";

export type GithubSyncOperation = "create" | "update" | "delete" | "labels";

export interface TrackerVersionRow {
	id: string;
	title: string;
	summary: string;
	theme: string;
	status: string;
	cutoff_json: string;
	sort_key: number;
	visibility: string;
	catalog_revision: string | null;
	created_at: string;
	updated_at: string;
}

export interface TrackerWorkstreamRow {
	version_id: string;
	slug: string;
	title: string;
	summary: string;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface TrackerDeliverableRow {
	version_id: string;
	id: string;
	title: string;
	description: string | null;
	closed_on: string | null;
	created_at: string;
	updated_at: string;
}

export interface TrackerTaskRow {
	version_id: string;
	id: string;
	title: string;
	status_column: string;
	priority: string;
	workstream: string | null;
	domain: string | null;
	area: string | null;
	feature: string | null;
	owner: string | null;
	sort_order: number | null;
	deliverable_id: string | null;
	body: string;
	spec_approval: string | null;
	completed_at: string | null;
	source_json: string;
	repo_paths_json: string;
	local_updated_at: string;
	created_at: string;
	updated_at: string;
}

export interface TrackerTaskSubtaskRow {
	id: number;
	version_id: string;
	task_id: string;
	text: string;
	done: number;
	sort_order: number;
}

export interface TrackerTaskSpecRelationRow {
	id: number;
	version_id: string;
	task_id: string;
	standard_id: string | null;
	catalog_revision: string | null;
	path: string;
	href: string | null;
	title: string | null;
	level: string | null;
	relation: string;
	required: number;
	sort_order: number;
}

export interface TrackerBugRow {
	id: string;
	title: string;
	body: string;
	state: string;
	author: string | null;
	component_id: string | null;
	subcomponent_id: string | null;
	fields_json: string;
	local_updated_at: string;
	created_at: string;
	updated_at: string;
}

export interface GithubIssueLinkRow {
	entity_type: string;
	entity_id: string;
	github_number: number;
	github_url: string;
	github_updated_at: string | null;
	last_synced_at: string | null;
	sync_state: string;
}

export interface GithubSyncOutboxRow {
	id: string;
	entity_type: string;
	entity_id: string;
	operation: string;
	payload_json: string;
	attempts: number;
	last_error: string | null;
	created_at: string;
}

export interface SyncSettingRow {
	key: string;
	value: string;
	updated_at: string;
}

export interface TrackerVersion {
	id: string;
	title: string;
	summary: string;
	theme: string;
	status: VersionStatus;
	cutoff: SeedVersionCutoff;
	sortKey: number;
	visibility: "internal" | "public";
	catalogRevision?: string;
	createdAt: string;
	updatedAt: string;
}

export interface TrackerWorkstream {
	versionId: string;
	slug: string;
	title: string;
	summary: string;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface TrackerDeliverable {
	versionId: string;
	id: string;
	title: string;
	description?: string;
	closedOn?: string;
	createdAt: string;
	updatedAt: string;
}

export interface TrackerTaskSubtask {
	id: number;
	text: string;
	done: boolean;
	sortOrder: number;
}

export interface TrackerTaskSpecRelation {
	id: number;
	standardId?: string;
	catalogRevision?: string;
	path: string;
	href?: string;
	title?: string;
	level?: string;
	relation: SpecRelationType;
	required: boolean;
	sortOrder: number;
}

export interface TrackerTask {
	versionId: string;
	id: string;
	title: string;
	statusColumn: RoadmapColumnId;
	priority: RoadmapPriority;
	workstream?: string;
	domain?: string;
	area?: string;
	feature?: string;
	owner?: string;
	sortOrder?: number;
	deliverableId?: string;
	body: string;
	specApproval?: SpecApprovalStatus;
	completedAt?: string;
	source: SeedGitSource;
	repoPaths?: string[];
	subtasks: TrackerTaskSubtask[];
	specRelations: TrackerTaskSpecRelation[];
	localUpdatedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface TrackerBug {
	id: string;
	title: string;
	body: string;
	state: "open" | "closed";
	author?: string;
	componentId?: string;
	subcomponentId?: string;
	fields: Record<string, unknown>;
	localUpdatedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface GithubIssueLink {
	entityType: TrackerEntityType;
	entityId: string;
	githubNumber: number;
	githubUrl: string;
	githubUpdatedAt?: string;
	lastSyncedAt?: string;
	syncState: GithubSyncState;
}

export interface GithubSyncOutboxEntry {
	id: string;
	entityType: TrackerEntityType;
	entityId: string;
	operation: GithubSyncOperation;
	payload: Record<string, unknown>;
	attempts: number;
	lastError?: string;
	createdAt: string;
}

export interface TrackerTaskWithContext extends TrackerTask {
	deliverableTitle?: string;
	displayNumber?: number;
}

export interface TrackerBugWithLink extends TrackerBug {
	githubLink?: GithubIssueLink;
}

export type { PublicBug, RoadmapPriority, SpecApprovalStatus };

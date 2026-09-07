import { beskidDocsUrl } from "#/lib/beskid-docs-origin";
import {
	areaLabel,
	domainLabel,
	featureLabel,
	priorityLabel,
	ROADMAP_SPEC_APPROVAL,
	type RoadmapColumnId,
	statusLabelForColumn,
	workstreamLabel,
} from "#/lib/github/roadmap-labels";
import type { PublicBug, RoadmapTask } from "#/lib/github/types";
import type {
	SpecRelation,
	SpecRelationType,
} from "#/lib/platform-spec/relations";
import type { SubtaskRow } from "#/lib/report-issue/field-values";
import { normalizeVersionStatus } from "#/lib/roadmap/version-status";
import type { SeedGitSource } from "#/lib/seed/schemas";
import type {
	GithubIssueLink,
	GithubIssueLinkRow,
	TrackerBug,
	TrackerBugRow,
	TrackerBugWithLink,
	TrackerDeliverable,
	TrackerDeliverableRow,
	TrackerTask,
	TrackerTaskRow,
	TrackerTaskSpecRelation,
	TrackerTaskSpecRelationRow,
	TrackerTaskSubtask,
	TrackerTaskSubtaskRow,
	TrackerTaskWithContext,
	TrackerVersion,
	TrackerVersionRow,
} from "#/lib/tracker/types";

function parseJson<T>(raw: string, fallback: T): T {
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function rowToTrackerVersion(row: TrackerVersionRow): TrackerVersion {
	return {
		id: row.id,
		title: row.title,
		summary: row.summary,
		theme: row.theme,
		status: normalizeVersionStatus(row.status as TrackerVersion["status"]),
		cutoff: parseJson(row.cutoff_json, {
			startDate: "1970-01-01",
			endDate: "1970-01-01",
			endCommitSha: "0000000",
			endCommitRepo: "beskid" as const,
			rationale: "",
		}),
		sortKey: row.sort_key,
		visibility: row.visibility === "public" ? "public" : "internal",
		catalogRevision: row.catalog_revision ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function rowToTrackerDeliverable(
	row: TrackerDeliverableRow,
): TrackerDeliverable {
	return {
		versionId: row.version_id,
		id: row.id,
		title: row.title,
		description: row.description ?? undefined,
		closedOn: row.closed_on ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function rowToTrackerTaskSubtask(
	row: TrackerTaskSubtaskRow,
): TrackerTaskSubtask {
	return {
		id: row.id,
		text: row.text,
		done: row.done === 1,
		sortOrder: row.sort_order,
	};
}

export function rowToTrackerTaskSpecRelation(
	row: TrackerTaskSpecRelationRow,
): TrackerTaskSpecRelation {
	return {
		id: row.id,
		standardId: row.standard_id ?? undefined,
		catalogRevision: row.catalog_revision ?? undefined,
		path: row.path,
		href: row.href ?? undefined,
		title: row.title ?? undefined,
		level: row.level ?? undefined,
		relation: row.relation as SpecRelationType,
		required: row.required === 1,
		sortOrder: row.sort_order,
	};
}

export function rowToTrackerTask(
	row: TrackerTaskRow,
	subtasks: TrackerTaskSubtaskRow[] = [],
	specRelations: TrackerTaskSpecRelationRow[] = [],
): TrackerTask {
	return {
		versionId: row.version_id,
		id: row.id,
		title: row.title,
		statusColumn: row.status_column as RoadmapColumnId,
		priority: row.priority as TrackerTask["priority"],
		workstream: row.workstream ?? undefined,
		domain: row.domain ?? undefined,
		area: row.area ?? undefined,
		feature: row.feature ?? undefined,
		owner: row.owner ?? undefined,
		sortOrder: row.sort_order ?? undefined,
		deliverableId: row.deliverable_id ?? undefined,
		body: row.body,
		specApproval: (row.spec_approval as TrackerTask["specApproval"]) ?? undefined,
		completedAt: row.completed_at ?? undefined,
		source: parseJson<SeedGitSource>(row.source_json, {
			repo: "beskid",
			commit: "0000000",
			subject: row.title,
		}),
		repoPaths: parseJson<string[]>(row.repo_paths_json ?? "[]", []).filter(
			(path) => typeof path === "string" && path.length > 0,
		),
		subtasks: subtasks.map(rowToTrackerTaskSubtask),
		specRelations: specRelations.map(rowToTrackerTaskSpecRelation),
		localUpdatedAt: row.local_updated_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function rowToGithubIssueLink(row: GithubIssueLinkRow): GithubIssueLink {
	return {
		entityType: row.entity_type as GithubIssueLink["entityType"],
		entityId: row.entity_id,
		githubNumber: row.github_number,
		githubUrl: row.github_url,
		githubUpdatedAt: row.github_updated_at ?? undefined,
		lastSyncedAt: row.last_synced_at ?? undefined,
		syncState: row.sync_state as GithubIssueLink["syncState"],
	};
}

export function rowToTrackerBug(row: TrackerBugRow): TrackerBug {
	return {
		id: row.id,
		title: row.title,
		body: row.body,
		state: row.state === "closed" ? "closed" : "open",
		author: row.author ?? undefined,
		componentId: row.component_id ?? undefined,
		subcomponentId: row.subcomponent_id ?? undefined,
		fields: parseJson<Record<string, unknown>>(row.fields_json, {}),
		localUpdatedAt: row.local_updated_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function buildTaskLabelNames(task: TrackerTask): string[] {
	const labels = [
		statusLabelForColumn(task.statusColumn),
		priorityLabel(task.priority),
	];
	if (task.workstream) labels.push(workstreamLabel(task.workstream));
	if (task.domain) labels.push(domainLabel(task.domain));
	if (task.area) labels.push(areaLabel(task.area));
	if (task.feature) labels.push(featureLabel(task.feature));
	if (task.specApproval === "pending") {
		labels.push(ROADMAP_SPEC_APPROVAL.pending);
	} else if (task.specRelations.length > 0) {
		labels.push(ROADMAP_SPEC_APPROVAL.approved);
	}
	return labels;
}

function subtasksToRows(subtasks: TrackerTaskSubtask[]): SubtaskRow[] {
	return subtasks.map((step) => ({
		id: `db-step-${step.id}`,
		text: step.text,
		done: step.done,
	}));
}

function relationsToSpecRelations(
	relations: TrackerTaskSpecRelation[],
): SpecRelation[] {
	return relations.map((relation) => ({
		standardId: relation.standardId,
		path: relation.path,
		href: relation.href ?? beskidDocsUrl(relation.path),
		title: relation.title,
		level: relation.level,
		relation: relation.relation,
		required: relation.required,
	}));
}

function bodyExcerpt(body: string, max = 240): string {
	const trimmed = body.trim().replace(/\s+/g, " ");
	if (trimmed.length <= max) return trimmed;
	return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function trackerTaskToRoadmapTask(
	task: TrackerTaskWithContext,
): RoadmapTask {
	const specRelations = relationsToSpecRelations(task.specRelations);
	const displayNumber = task.displayNumber ?? task.sortOrder ?? 0;

	return {
		id: task.id,
		number: displayNumber,
		title: task.title,
		owner: task.owner ?? task.source.repo,
		priority: task.priority,
		statusColumn: task.statusColumn,
		body: task.body,
		specRelations,
		subtasks: subtasksToRows(task.subtasks),
		repoPaths: task.repoPaths,
		specApproval:
			task.specApproval ?? (specRelations.length > 0 ? "approved" : undefined),
		version: task.versionId,
		workstream: task.workstream,
		domain: task.domain,
		area: task.area,
		feature: task.feature,
		htmlUrl: beskidDocsUrl(`/tracker/tasks/${task.versionId}/${task.id}`),
		milestone: task.deliverableTitle
			? { title: task.deliverableTitle, number: 0 }
			: undefined,
		labelNames: buildTaskLabelNames(task),
	};
}

export function trackerBugToPublicBug(bug: TrackerBugWithLink): PublicBug {
	const githubNumber = bug.githubLink?.githubNumber ?? 0;
	return {
		number: githubNumber,
		title: bug.title,
		state: bug.state,
		htmlUrl:
			bug.githubLink?.githubUrl ?? beskidDocsUrl(`/tracker/bugs/${bug.id}`),
		createdAt: bug.createdAt,
		labels: ["bug"],
		bodyExcerpt: bodyExcerpt(bug.body),
		author: bug.author,
	};
}

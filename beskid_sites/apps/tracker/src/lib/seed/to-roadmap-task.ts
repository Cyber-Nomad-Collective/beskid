import { beskidDocsUrl } from "#/lib/beskid-docs-origin";
import {
	areaLabel,
	domainLabel,
	featureLabel,
	priorityLabel,
	ROADMAP_SPEC_APPROVAL,
	statusLabelForColumn,
	workstreamLabel,
} from "#/lib/github/roadmap-labels";
import type { RoadmapTask } from "#/lib/github/types";
import type { SpecRelation } from "#/lib/platform-spec/relations";
import type { SubtaskRow } from "#/lib/report-issue/field-values";

import type {
	SeedDeliverable,
	SeedSubtask,
	SeedTask,
	SeedVersion,
} from "#/lib/seed/schemas";

const REPO_COMMIT_URL: Record<string, string> = {
	beskid: "https://github.com/Cyber-Nomad-Collective/beskid/commit",
	compiler: "https://github.com/Cyber-Nomad-Collective/compiler/commit",
	pckg: "https://github.com/Cyber-Nomad-Collective/pckg/commit",
	site: "https://github.com/Cyber-Nomad-Collective/beskid/commit",
	beskid_vscode:
		"https://github.com/Cyber-Nomad-Collective/beskid_vscode/commit",
	pekan: "https://github.com/Cyber-Nomad-Collective/pekan/commit",
	corelib: "https://github.com/Cyber-Nomad-Collective/beskid_standard/commit",
};

function commitUrl(repo: string, sha: string): string {
	const base = REPO_COMMIT_URL[repo] ?? REPO_COMMIT_URL.beskid;
	return `${base}/${sha}`;
}

function normalizeRelations(
	relations: SeedTask["specRelations"],
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

function seedSubtasksToRows(subtasks: SeedSubtask[]): SubtaskRow[] {
	return subtasks.map((step, index) => ({
		id: `seed-step-${index}`,
		text: step.text,
		done: step.done,
	}));
}

function buildLabelNames(task: SeedTask): string[] {
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

function buildBody(version: SeedVersion, task: SeedTask): string {
	const provenance = [
		`Seed task derived from git history (${version.id} cutoff ${version.cutoff.endDate}).`,
		"",
		`| Field | Value |`,
		`|-------|-------|`,
		`| Repository | \`${task.source.repo}\` |`,
		`| Commit | [\`${task.source.commit.slice(0, 7)}\`](${commitUrl(task.source.repo, task.source.commit)}) |`,
		`| Subject | ${task.source.subject} |`,
	];
	if (task.completedAt) {
		provenance.push(`| Completed | ${task.completedAt} |`);
	}
	const sections = [task.body?.trim(), provenance.join("\n")].filter(Boolean);
	return sections.join("\n\n");
}

export function seedTaskToRoadmapTask(
	version: SeedVersion,
	task: SeedTask,
	deliverables: Map<string, SeedDeliverable>,
	displayNumber: number,
): RoadmapTask {
	const specRelations = normalizeRelations(task.specRelations);
	const deliverableId = task.deliverableId ?? task.milestoneId;
	const deliverable = deliverableId
		? deliverables.get(deliverableId)
		: undefined;

	return {
		id: task.id,
		number: displayNumber,
		title: task.title,
		owner: task.owner ?? "beskid",
		priority: task.priority,
		statusColumn: task.statusColumn,
		body: buildBody(version, task),
		specRelations,
		subtasks: seedSubtasksToRows(task.subtasks),
		repoPaths: task.repoPaths,
		specApproval:
			task.specApproval ?? (specRelations.length > 0 ? "approved" : undefined),
		version: version.id,
		workstream: task.workstream,
		domain: task.domain,
		area: task.area,
		feature: task.feature,
		htmlUrl: task.source.url ?? commitUrl(task.source.repo, task.source.commit),
		milestone: deliverable ? { title: deliverable.title, number: 0 } : undefined,
		labelNames: buildLabelNames(task),
	};
}

/** GitHub label prefixes for roadmap metadata (stateless source of truth). */

export const ROADMAP_STATUS_PREFIX = "roadmap/status/";

export const ROADMAP_STATUS_LABELS = {
	backlog: "roadmap/status/backlog",
	inProgress: "roadmap/status/in-progress",
	done: "roadmap/status/done",
} as const;

export const ROADMAP_PRIORITY_LABELS = {
	high: "roadmap/priority/high",
	medium: "roadmap/priority/medium",
	low: "roadmap/priority/low",
} as const;

export const ROADMAP_VERSION_PREFIX = "roadmap/version/";

export const DEFAULT_DELIVERY_VERSIONS = [
	"v0.1",
	"v0.2",
	"v0.3",
	"v0.4",
] as const;

export type DeliveryVersion = (typeof DEFAULT_DELIVERY_VERSIONS)[number];

/** Delivery band id carried on GitHub Milestone titles (e.g. v0.2). */
export const DELIVERY_VERSION_ID_RE = /^v\d+\.\d+$/;

export function isDeliveryVersionId(value: string): boolean {
	return DELIVERY_VERSION_ID_RE.test(value);
}

export function versionFromMilestoneTitle(
	title: string | null | undefined,
): string | undefined {
	if (!title) return undefined;
	const trimmed = title.trim();
	return isDeliveryVersionId(trimmed) ? trimmed : undefined;
}

export const ROADMAP_WORKSTREAM_PREFIX = "roadmap/workstream/";

export const ROADMAP_DOMAIN_PREFIX = "roadmap/domain/";

export const ROADMAP_AREA_PREFIX = "roadmap/area/";

export const ROADMAP_FEATURE_PREFIX = "roadmap/feature/";

export const ROADMAP_SPEC_APPROVAL_PREFIX = "roadmap/spec-approval/";

export const ROADMAP_SPEC_APPROVAL = {
	pending: "roadmap/spec-approval/pending",
	approved: "roadmap/spec-approval/approved",
} as const;

export const ROADMAP_COLUMNS = [
	{ id: "Backlog", statusLabel: ROADMAP_STATUS_LABELS.backlog },
	{ id: "In Progress", statusLabel: ROADMAP_STATUS_LABELS.inProgress },
	{ id: "Done", statusLabel: ROADMAP_STATUS_LABELS.done },
] as const;

export type RoadmapColumnId = (typeof ROADMAP_COLUMNS)[number]["id"];

const STATUS_LABEL_TO_COLUMN = new Map<string, RoadmapColumnId>(
	ROADMAP_COLUMNS.map((column) => [column.statusLabel, column.id]),
);

export function versionLabel(version: string): string {
	return `${ROADMAP_VERSION_PREFIX}${version}`;
}

export function workstreamLabel(slug: string): string {
	return `${ROADMAP_WORKSTREAM_PREFIX}${slug}`;
}

export function domainLabel(slug: string): string {
	return `${ROADMAP_DOMAIN_PREFIX}${slug}`;
}

export function areaLabel(slug: string): string {
	return `${ROADMAP_AREA_PREFIX}${slug}`;
}

export function featureLabel(slug: string): string {
	return `${ROADMAP_FEATURE_PREFIX}${slug}`;
}

export function statusLabelForColumn(columnId: RoadmapColumnId): string {
	const column = ROADMAP_COLUMNS.find((entry) => entry.id === columnId);
	if (!column) {
		throw new Error(`Unknown roadmap column: ${columnId}`);
	}
	return column.statusLabel;
}

export function columnIdForStatusLabel(label: string): RoadmapColumnId {
	return STATUS_LABEL_TO_COLUMN.get(label) ?? "Backlog";
}

export function isRoadmapStatusLabel(label: string): boolean {
	return label.startsWith(ROADMAP_STATUS_PREFIX);
}

export function isRoadmapVersionLabel(label: string): boolean {
	return label.startsWith(ROADMAP_VERSION_PREFIX);
}

export function versionFromLabel(label: string): string | undefined {
	if (!isRoadmapVersionLabel(label)) return undefined;
	return label.slice(ROADMAP_VERSION_PREFIX.length);
}

export function workstreamFromLabel(label: string): string | undefined {
	if (!label.startsWith(ROADMAP_WORKSTREAM_PREFIX)) return undefined;
	return label.slice(ROADMAP_WORKSTREAM_PREFIX.length);
}

export function domainFromLabel(label: string): string | undefined {
	if (!label.startsWith(ROADMAP_DOMAIN_PREFIX)) return undefined;
	return label.slice(ROADMAP_DOMAIN_PREFIX.length);
}

export function areaFromLabel(label: string): string | undefined {
	if (!label.startsWith(ROADMAP_AREA_PREFIX)) return undefined;
	return label.slice(ROADMAP_AREA_PREFIX.length);
}

export function featureFromLabel(label: string): string | undefined {
	if (!label.startsWith(ROADMAP_FEATURE_PREFIX)) return undefined;
	return label.slice(ROADMAP_FEATURE_PREFIX.length);
}

export function specApprovalFromLabels(
	labels: string[],
): "pending" | "approved" | undefined {
	if (labels.includes(ROADMAP_SPEC_APPROVAL.approved)) return "approved";
	if (labels.includes(ROADMAP_SPEC_APPROVAL.pending)) return "pending";
	return undefined;
}

export function priorityFromLabels(
	labels: string[],
): "high" | "medium" | "low" {
	if (labels.includes(ROADMAP_PRIORITY_LABELS.high)) return "high";
	if (labels.includes(ROADMAP_PRIORITY_LABELS.medium)) return "medium";
	return "low";
}

export function priorityLabel(priority: "high" | "medium" | "low"): string {
	return ROADMAP_PRIORITY_LABELS[priority];
}

export function stripRoadmapScopedLabels(labels: string[]): string[] {
	return labels.filter(
		(name) =>
			!isRoadmapStatusLabel(name) &&
			!isRoadmapVersionLabel(name) &&
			!name.startsWith(ROADMAP_WORKSTREAM_PREFIX) &&
			!name.startsWith(ROADMAP_DOMAIN_PREFIX) &&
			!name.startsWith(ROADMAP_AREA_PREFIX) &&
			!name.startsWith(ROADMAP_FEATURE_PREFIX) &&
			!name.startsWith(ROADMAP_SPEC_APPROVAL_PREFIX) &&
			!Object.values(ROADMAP_PRIORITY_LABELS).includes(
				name as (typeof ROADMAP_PRIORITY_LABELS)[keyof typeof ROADMAP_PRIORITY_LABELS],
			),
	);
}

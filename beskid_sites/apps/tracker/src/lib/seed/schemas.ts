import { z } from "zod";
import { SPEC_RELATION_TYPES } from "#/lib/platform-spec/relations";
import { VERSION_STATUSES } from "#/lib/roadmap/version-status";

/** Relative path from package root for exported JSON Schema artifacts. */
export const SEED_JSON_SCHEMA_DIR = "schemas/seed";

export const seedGitSourceSchema = z.object({
	repo: z.string().min(1),
	commit: z.string().regex(/^[0-9a-f]{7,40}$/i),
	subject: z.string().min(1),
	url: z.string().url().optional(),
});

export const seedSpecRelationSchema = z.object({
	standardId: z.string().min(1).optional(),
	catalogRevision: z.string().min(1).optional(),
	path: z.string().min(1),
	href: z.string().url().optional(),
	title: z.string().optional(),
	level: z.string().optional(),
	relation: z.enum(SPEC_RELATION_TYPES),
	required: z.boolean().default(false),
});

export const seedSubtaskSchema = z.object({
	text: z.string().min(1),
	done: z.boolean().default(false),
});

export const seedVersionCutoffSchema = z.object({
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	startCommitSha: z.string().optional(),
	endCommitSha: z.string().min(7),
	endCommitRepo: z.enum(["beskid", "compiler", "pckg", "site", "beskid_vscode"]),
	rationale: z.string().min(1),
});

export const seedVersionSchema = z.object({
	$schema: z.string().optional(),
	id: z.string().regex(/^v\d+\.\d+$/),
	title: z.string().min(1),
	summary: z.string().min(1),
	theme: z.string().min(1),
	status: z.enum(VERSION_STATUSES).optional(),
	cutoff: seedVersionCutoffSchema,
});

export const seedWorkstreamSchema = z.object({
	$schema: z.string().optional(),
	slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	title: z.string().min(1),
	summary: z.string().min(1),
	order: z.number().int().nonnegative().optional(),
});

export const seedDeliverableSchema = z.object({
	$schema: z.string().optional(),
	id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	title: z.string().min(1),
	description: z.string().optional(),
	closedOn: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	subtasks: z.array(seedSubtaskSchema).default([]),
});

export const seedTaskSchema = z.object({
	$schema: z.string().optional(),
	id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	title: z.string().min(1),
	statusColumn: z.enum(["Backlog", "In Progress", "Done"]),
	priority: z.enum(["high", "medium", "low"]).default("medium"),
	/** Sort key within a version (lower first). Replaces legacy `number`. */
	order: z.number().int().nonnegative().optional(),
	workstream: z.string().optional(),
	domain: z.string().optional(),
	area: z.string().optional(),
	feature: z.string().optional(),
	owner: z.string().optional(),
	completedAt: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	deliverableId: z.string().optional(),
	/** @deprecated Prefer deliverableId */
	milestoneId: z.string().optional(),
	specRelations: z.array(seedSpecRelationSchema).default([]),
	specApproval: z.enum(["pending", "approved"]).optional(),
	body: z.string().optional(),
	/** Repo-relative paths attached via RepoExplorerDialog (task metadata). */
	repoPaths: z.array(z.string().min(1)).optional(),
	subtasks: z.array(seedSubtaskSchema).default([]),
	source: seedGitSourceSchema,
});

export type SeedGitSource = z.infer<typeof seedGitSourceSchema>;
export type SeedSubtask = z.infer<typeof seedSubtaskSchema>;
export type SeedVersion = z.infer<typeof seedVersionSchema>;
export type SeedWorkstream = z.infer<typeof seedWorkstreamSchema>;
export type SeedDeliverable = z.infer<typeof seedDeliverableSchema>;
export type SeedTask = z.infer<typeof seedTaskSchema>;

/** Compare seed tasks for board/catalog ordering. */
export function compareSeedTasks(a: SeedTask, b: SeedTask): number {
	const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
	const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
	if (orderA !== orderB) return orderA - orderB;
	return a.id.localeCompare(b.id);
}

export function compareSeedDeliverables(
	a: SeedDeliverable,
	b: SeedDeliverable,
): number {
	return a.id.localeCompare(b.id);
}

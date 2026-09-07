import { createHash } from "node:crypto";
import type { ParsedSeedBundle } from "#/lib/seed/parse-uploaded-bundle";
import type { Database } from "#/lib/storage/sqlite";
import type { TrackerSpecLink } from "#/lib/tracker/delivery-contract";
import {
	listTrackerTasks,
	upsertTrackerTask,
} from "#/lib/tracker/repositories/tasks-repository";

export interface ReconciliationCatalog {
	revision: string;
	links: Array<Pick<TrackerSpecLink, "standardId" | "catalogRevision">>;
}

export interface ReconciliationPlan {
	versionId: string;
	create: Array<{ taskId: string }>;
	stale: Array<{ taskId: string; reason: "catalog-revision" }>;
	conflicts: Array<{ taskId: string; reason: "local-and-seed-diverged" }>;
	proposalDigest: string;
	approvedProposalDigest?: string;
	readonly createTasks: ParsedSeedBundle["tasks"];
}

export interface ReconciliationSummary {
	created: number;
	stale: number;
	conflicts: number;
}

export interface PlanTrackerReconciliationInput {
	database: Database;
	seed: ParsedSeedBundle;
	catalog: ReconciliationCatalog;
}

function canonicalJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		return `{${Object.keys(record)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}

function proposalDigest(
	value: Omit<ReconciliationPlan, "proposalDigest" | "approvedProposalDigest">,
): string {
	return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function isLocallyDiverged(
	databaseTask: { title: string; source: { commit: string } },
	seedTask: { title: string; source: { commit: string } },
): boolean {
	return (
		databaseTask.title !== seedTask.title ||
		databaseTask.source.commit !== seedTask.source.commit
	);
}

export function planTrackerReconciliation(
	input: PlanTrackerReconciliationInput,
): ReconciliationPlan {
	const databaseTasks = listTrackerTasks(input.seed.versionId, input.database);
	const seedById = new Map(input.seed.tasks.map((task) => [task.id, task]));
	const createTasks = input.seed.tasks.filter(
		(task) => !databaseTasks.some((databaseTask) => databaseTask.id === task.id),
	);
	const conflicts = databaseTasks.flatMap((databaseTask) => {
		const seedTask = seedById.get(databaseTask.id);
		return seedTask && isLocallyDiverged(databaseTask, seedTask)
			? [{ taskId: databaseTask.id, reason: "local-and-seed-diverged" as const }]
			: [];
	});
	const stale = databaseTasks.flatMap((task) =>
		task.specRelations.some(
			(relation) =>
				relation.standardId &&
				input.catalog.links.some(
					(link) =>
						link.standardId === relation.standardId &&
						link.catalogRevision === input.catalog.revision &&
						link.catalogRevision !== relation.catalogRevision,
				),
		)
			? [{ taskId: task.id, reason: "catalog-revision" as const }]
			: [],
	);
	const unsigned = {
		versionId: input.seed.versionId,
		create: createTasks.map((task) => ({ taskId: task.id })),
		stale,
		conflicts,
		createTasks,
	};
	return { ...unsigned, proposalDigest: proposalDigest(unsigned) };
}

export function applyTrackerReconciliation(
	db: Database,
	plan: ReconciliationPlan,
): ReconciliationSummary {
	const expectedDigest = proposalDigest({
		versionId: plan.versionId,
		create: plan.create,
		stale: plan.stale,
		conflicts: plan.conflicts,
		createTasks: plan.createTasks,
	});
	if (
		plan.proposalDigest !== expectedDigest ||
		plan.approvedProposalDigest !== expectedDigest
	) {
		throw new Error("Reconciliation requires an approved proposal digest");
	}
	const tx = db.transaction(() => {
		for (const task of plan.createTasks) {
			upsertTrackerTask(db, plan.versionId, task);
		}
	});
	tx();
	return {
		created: plan.create.length,
		stale: plan.stale.length,
		conflicts: plan.conflicts.length,
	};
}

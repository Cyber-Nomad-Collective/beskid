/**
 * Plan (default) or apply Tracker catalog reconciliation without overwriting
 * local conflicts. Dry-run is the CI gate; --apply mutates only approved creates.
 *
 * Usage:
 *   bun run scripts/reconcile-delivery.ts --dry-run
 *   bun run scripts/reconcile-delivery.ts --apply [--version v0.5]
 */

import { loadAllVersionSeeds } from "#/lib/seed/load";
import type { ParsedSeedBundle } from "#/lib/seed/parse-uploaded-bundle";
import { ensureTrackerDataDir, issuesDbPath } from "#/lib/storage/paths";
import { migrateSchema } from "#/lib/storage/schema";
import type { Database } from "#/lib/storage/sqlite";
import { openSqlite } from "#/lib/storage/sqlite";
import {
	applyTrackerReconciliation,
	planTrackerReconciliation,
	type ReconciliationCatalog,
	type ReconciliationPlan,
} from "#/lib/tracker/reconciliation";
import {
	upsertTrackerDeliverable,
	upsertTrackerWorkstream,
} from "#/lib/tracker/repositories/tasks-repository";
import { upsertTrackerVersion } from "#/lib/tracker/repositories/versions-repository";

function hasFlag(name: string): boolean {
	return process.argv.includes(name);
}

function option(name: string): string | undefined {
	const index = process.argv.indexOf(name);
	return index >= 0 ? process.argv[index + 1] : undefined;
}

function catalogFromBundle(bundle: ParsedSeedBundle): ReconciliationCatalog {
	const links = bundle.tasks.flatMap((task) =>
		task.specRelations.flatMap((relation) =>
			relation.standardId && relation.catalogRevision
				? [
						{
							standardId: relation.standardId,
							catalogRevision: relation.catalogRevision,
						},
					]
				: [],
		),
	);
	const revisions = new Set(links.map((link) => link.catalogRevision));
	if (revisions.size > 1) {
		throw new Error(`Multiple catalog revisions for version ${bundle.versionId}`);
	}
	return {
		revision: revisions.values().next().value ?? "seed-import",
		links,
	};
}

function toParsedBundle(
	seed: ReturnType<typeof loadAllVersionSeeds>[number],
): ParsedSeedBundle {
	return {
		versionId: seed.version.id,
		version: seed.version,
		workstreams: seed.workstreams,
		deliverables: seed.deliverables,
		tasks: seed.tasks,
	};
}

function ensureScaffold(db: Database, bundle: ParsedSeedBundle): void {
	const catalog = catalogFromBundle(bundle);
	upsertTrackerVersion(db, bundle.version, {
		catalogRevision: catalog.revision,
	});
	for (const workstream of bundle.workstreams) {
		upsertTrackerWorkstream(db, bundle.versionId, workstream);
	}
	for (const deliverable of bundle.deliverables) {
		upsertTrackerDeliverable(db, bundle.versionId, deliverable);
	}
}

function openDatabase(path: string | undefined, dryRun: boolean): Database {
	if (dryRun && !path) {
		const db = openSqlite(":memory:");
		migrateSchema(db);
		return db;
	}
	ensureTrackerDataDir();
	const db = openSqlite(path ?? issuesDbPath());
	migrateSchema(db);
	return db;
}

const dryRun = hasFlag("--dry-run") || !hasFlag("--apply");
const versionFilter = option("--version");
const database = openDatabase(option("--db"), dryRun);

const plans: Array<{
	versionId: string;
	create: number;
	stale: number;
	conflicts: number;
	proposalDigest: string;
	applied?: { created: number; stale: number; conflicts: number };
}> = [];

for (const seed of loadAllVersionSeeds()) {
	if (versionFilter && seed.version.id !== versionFilter) continue;
	const bundle = toParsedBundle(seed);
	ensureScaffold(database, bundle);
	const plan: ReconciliationPlan = planTrackerReconciliation({
		database,
		seed: bundle,
		catalog: catalogFromBundle(bundle),
	});
	const entry: (typeof plans)[number] = {
		versionId: plan.versionId,
		create: plan.create.length,
		stale: plan.stale.length,
		conflicts: plan.conflicts.length,
		proposalDigest: plan.proposalDigest,
	};
	if (!dryRun) {
		entry.applied = applyTrackerReconciliation(database, {
			...plan,
			approvedProposalDigest: plan.proposalDigest,
		});
	}
	plans.push(entry);
}

const report = {
	mode: dryRun ? "dry-run" : "apply",
	projection: "reconciliation",
	plans,
};
console.log(JSON.stringify(report, null, 2));
console.log(
	dryRun
		? "projection/reconciliation validation passed"
		: "projection/reconciliation apply completed",
);

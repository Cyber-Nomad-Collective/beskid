import "@tanstack/react-start/server-only";

import type { ParsedSeedBundle } from "#/lib/seed/parse-uploaded-bundle";

import { getIssuesDatabase } from "#/lib/storage/db";
import type { Database } from "#/lib/storage/sqlite";
import {
	applyTrackerReconciliation,
	planTrackerReconciliation,
	type ReconciliationCatalog,
} from "#/lib/tracker/reconciliation";
import {
	upsertTrackerDeliverable,
	upsertTrackerWorkstream,
} from "#/lib/tracker/repositories/tasks-repository";
import { upsertTrackerVersion } from "#/lib/tracker/repositories/versions-repository";

export interface CatalogImportSummary {
	versionsUpserted: number;
	workstreamsUpserted: number;
	deliverablesUpserted: number;
	tasksUpserted: number;
	conflicts: number;
	stale: number;
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
	const catalogRevisions = new Set(links.map((link) => link.catalogRevision));
	if (catalogRevisions.size > 1) {
		throw new Error(`Multiple catalog revisions for version ${bundle.versionId}`);
	}
	return {
		revision: catalogRevisions.values().next().value ?? "seed-import",
		links,
	};
}

function upsertBundleInTransaction(
	db: Database,
	bundle: ParsedSeedBundle,
): CatalogImportSummary {
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

	const plan = planTrackerReconciliation({
		database: db,
		seed: bundle,
		catalog,
	});
	const applied = applyTrackerReconciliation(db, {
		...plan,
		approvedProposalDigest: plan.proposalDigest,
	});

	return {
		versionsUpserted: 1,
		workstreamsUpserted: bundle.workstreams.length,
		deliverablesUpserted: bundle.deliverables.length,
		tasksUpserted: applied.created,
		conflicts: applied.conflicts,
		stale: applied.stale,
	};
}

function mergeSummaries(
	accumulator: CatalogImportSummary,
	next: CatalogImportSummary,
): CatalogImportSummary {
	return {
		versionsUpserted: accumulator.versionsUpserted + next.versionsUpserted,
		workstreamsUpserted:
			accumulator.workstreamsUpserted + next.workstreamsUpserted,
		deliverablesUpserted:
			accumulator.deliverablesUpserted + next.deliverablesUpserted,
		tasksUpserted: accumulator.tasksUpserted + next.tasksUpserted,
		conflicts: accumulator.conflicts + next.conflicts,
		stale: accumulator.stale + next.stale,
	};
}

export function upsertParsedSeedBundle(
	bundle: ParsedSeedBundle,
	db?: Database,
): CatalogImportSummary {
	const database = db ?? getIssuesDatabase();
	const tx = database.transaction((input: ParsedSeedBundle) =>
		upsertBundleInTransaction(database, input),
	);
	return tx(bundle);
}

export function upsertParsedSeedBundles(
	bundles: ParsedSeedBundle[],
	db?: Database,
): CatalogImportSummary {
	const database = db ?? getIssuesDatabase();
	const tx = database.transaction((inputs: ParsedSeedBundle[]) => {
		let summary: CatalogImportSummary = {
			versionsUpserted: 0,
			workstreamsUpserted: 0,
			deliverablesUpserted: 0,
			tasksUpserted: 0,
			conflicts: 0,
			stale: 0,
		};
		for (const bundle of inputs) {
			summary = mergeSummaries(
				summary,
				upsertBundleInTransaction(database, bundle),
			);
		}
		return summary;
	});
	return tx(bundles);
}

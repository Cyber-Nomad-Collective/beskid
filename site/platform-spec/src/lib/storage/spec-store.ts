// Upsert seeding of the native-shape spec model into the SQLite settings
// database. Pure module: it operates on a caller-supplied `Database` handle so
// it works both inside the server runtime and under the standalone seed script.
// Every write is an idempotent upsert (`ON CONFLICT DO UPDATE`) keyed by the
// natural OpenSpec identifier, so re-seeding an unchanged revision is a no-op
// and a changed revision converges in place without duplicates.

import { createHash } from "node:crypto";
import type { Database } from "bun:sqlite";

import { migrateSchema } from "#/lib/storage/schema";
import type { SeedWorkspace } from "#/lib/spec/static";

export interface SeedStoreResult {
	revision: string;
	capabilities: number;
	layouts: number;
	prunedCapabilities: number;
}

function sha256(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

export function seedSpecStore(
	db: Database,
	workspace: SeedWorkspace,
): SeedStoreResult {
	migrateSchema(db);
	const now = new Date().toISOString();

	const upsertCapability = db.prepare(`
		INSERT INTO spec_capability (
			capability, id, slug, href, title, description, status, spec_level,
			domain, area, feature, requirement_count, layout_id, layout_ok,
			content_hash, payload, updated_at
		) VALUES (
			$capability, $id, $slug, $href, $title, $description, $status, $spec_level,
			$domain, $area, $feature, $requirement_count, $layout_id, $layout_ok,
			$content_hash, $payload, $updated_at
		)
		ON CONFLICT(capability) DO UPDATE SET
			id = excluded.id,
			slug = excluded.slug,
			href = excluded.href,
			title = excluded.title,
			description = excluded.description,
			status = excluded.status,
			spec_level = excluded.spec_level,
			domain = excluded.domain,
			area = excluded.area,
			feature = excluded.feature,
			requirement_count = excluded.requirement_count,
			layout_id = excluded.layout_id,
			layout_ok = excluded.layout_ok,
			content_hash = excluded.content_hash,
			payload = excluded.payload,
			updated_at = excluded.updated_at
	`);

	const upsertLayout = db.prepare(`
		INSERT INTO spec_layout (id, spec_level, title, payload, updated_at)
		VALUES ($id, $spec_level, $title, $payload, $updated_at)
		ON CONFLICT(id) DO UPDATE SET
			spec_level = excluded.spec_level,
			title = excluded.title,
			payload = excluded.payload,
			updated_at = excluded.updated_at
	`);

	const upsertMeta = db.prepare(`
		INSERT INTO spec_seed_meta (key, value, updated_at)
		VALUES ($key, $value, $updated_at)
		ON CONFLICT(key) DO UPDATE SET
			value = excluded.value,
			updated_at = excluded.updated_at
	`);

	const seededCapabilities = new Set<string>();
	const seededLayouts = new Set<string>();
	const deleteCapability = db.prepare(
		"DELETE FROM spec_capability WHERE capability = ?",
	);
	const deleteLayout = db.prepare("DELETE FROM spec_layout WHERE id = ?");
	let prunedCapabilities = 0;

	const run = db.transaction(() => {
		for (const entry of workspace.catalog.entries) {
			const bundle = workspace.documents[entry.slug];
			const validation = workspace.layouts.validations[entry.capability];
			const body = bundle?.body ?? "";
			upsertCapability.run({
				$capability: entry.capability,
				$id: entry.id,
				$slug: entry.slug,
				$href: entry.href,
				$title: entry.title,
				$description: entry.description,
				$status: entry.status,
				$spec_level: entry.specLevel,
				$domain: entry.domain,
				$area: entry.area,
				$feature: entry.feature,
				$requirement_count: entry.requirements.length,
				$layout_id: validation?.layoutId ?? null,
				$layout_ok: validation ? (validation.ok ? 1 : 0) : 1,
				$content_hash: sha256(body),
				$payload: JSON.stringify(bundle ?? entry),
				$updated_at: now,
			});
			seededCapabilities.add(entry.capability);
		}

		for (const layout of workspace.layouts.layouts) {
			upsertLayout.run({
				$id: layout.id,
				$spec_level: layout.specLevel,
				$title: layout.title,
				$payload: JSON.stringify(layout),
				$updated_at: now,
			});
			seededLayouts.add(layout.id);
		}

		upsertMeta.run({
			$key: "revision",
			$value: workspace.meta.revision,
			$updated_at: now,
		});
		upsertMeta.run({
			$key: "meta",
			$value: JSON.stringify(workspace.meta),
			$updated_at: now,
		});
		upsertMeta.run({
			$key: "domain-model",
			$value: JSON.stringify(workspace.domainModel),
			$updated_at: now,
		});

		// Prune capabilities and layouts that no longer exist in the current
		// OpenSpec revision within the same transaction as the upserts and
		// metadata, so metadata never commits ahead of stale-row removal.
		const existingCapabilities = db
			.query<{ capability: string }, []>(
				"SELECT capability FROM spec_capability",
			)
			.all();
		for (const row of existingCapabilities) {
			if (!seededCapabilities.has(row.capability)) {
				deleteCapability.run(row.capability);
				prunedCapabilities += 1;
			}
		}

		const existingLayouts = db
			.query<{ id: string }, []>("SELECT id FROM spec_layout")
			.all();
		for (const row of existingLayouts) {
			if (!seededLayouts.has(row.id)) {
				deleteLayout.run(row.id);
			}
		}
	});

	run();

	return {
		revision: workspace.meta.revision,
		capabilities: seededCapabilities.size,
		layouts: workspace.layouts.layouts.length,
		prunedCapabilities,
	};
}

export function readSeedRevision(db: Database): string | null {
	const row = db
		.query<{ value: string }, []>(
			"SELECT value FROM spec_seed_meta WHERE key = 'revision'",
		)
		.get();
	return row?.value ?? null;
}

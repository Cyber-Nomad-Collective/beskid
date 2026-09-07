/**
 * Writes JSON Schema Draft 2020-12 artifacts from Zod seed schemas.
 * Run: bun run scripts/export-seed-json-schema.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	SEED_JSON_SCHEMA_DIR,
	seedDeliverableSchema,
	seedGitSourceSchema,
	seedSpecRelationSchema,
	seedSubtaskSchema,
	seedTaskSchema,
	seedVersionCutoffSchema,
	seedVersionSchema,
	seedWorkstreamSchema,
} from "#/lib/seed/schemas";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const outDir = path.join(packageRoot, SEED_JSON_SCHEMA_DIR);

const BASE = "https://beskid-lang.org/schemas/seed";

function writeSchema(name: string, schema: Record<string, unknown>): void {
	const withMeta = {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: `${BASE}/${name}`,
		...schema,
	};
	fs.writeFileSync(
		path.join(outDir, name),
		`${JSON.stringify(withMeta, null, 2)}\n`,
	);
}

fs.mkdirSync(outDir, { recursive: true });

writeSchema("git-source.schema.json", seedGitSourceSchema.toJSONSchema());
writeSchema("spec-relation.schema.json", seedSpecRelationSchema.toJSONSchema());
writeSchema("subtask.schema.json", seedSubtaskSchema.toJSONSchema());
writeSchema(
	"version-cutoff.schema.json",
	seedVersionCutoffSchema.toJSONSchema(),
);
writeSchema("version.schema.json", seedVersionSchema.toJSONSchema());
writeSchema("workstream.schema.json", seedWorkstreamSchema.toJSONSchema());
writeSchema("deliverable.schema.json", seedDeliverableSchema.toJSONSchema());
writeSchema("task.schema.json", seedTaskSchema.toJSONSchema());

const index = {
	$schema: "https://json-schema.org/draft/2020-12/schema",
	$id: `${BASE}/index.json`,
	title: "Beskid tracker roadmap seed catalog",
	description:
		"One JSON file per entity under data/v0.x/. Tasks and deliverables use slug `id` (not issue numbers). Sort tasks with optional `order`. Checklist work is modeled as `subtasks` steps.",
	$defs: {
		gitSource: { $ref: `${BASE}/git-source.schema.json` },
		specRelation: { $ref: `${BASE}/spec-relation.schema.json` },
		subtask: { $ref: `${BASE}/subtask.schema.json` },
		versionCutoff: { $ref: `${BASE}/version-cutoff.schema.json` },
		version: { $ref: `${BASE}/version.schema.json` },
		workstream: { $ref: `${BASE}/workstream.schema.json` },
		deliverable: { $ref: `${BASE}/deliverable.schema.json` },
		task: { $ref: `${BASE}/task.schema.json` },
	},
};

fs.writeFileSync(
	path.join(outDir, "index.json"),
	`${JSON.stringify(index, null, 2)}\n`,
);

console.log(`Wrote JSON Schema to ${outDir}/`);

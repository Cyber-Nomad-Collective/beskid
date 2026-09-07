/**
 * Migrates seed JSON to the v2 catalog shape: drops legacy `number`, maps it to
 * `order` on tasks, adds `subtasks` arrays, and optional `$schema` pointers.
 *
 * Run: bun run scripts/migrate-seed-catalog.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	listSeedVersionIds,
	readJsonFile,
	seedVersionDir,
} from "#/lib/seed/paths";
import {
	SEED_JSON_SCHEMA_DIR,
	seedDeliverableSchema,
	seedTaskSchema,
	seedVersionSchema,
	seedWorkstreamSchema,
} from "#/lib/seed/schemas";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const schemaBase = `../${SEED_JSON_SCHEMA_DIR}`;

function schemaRef(file: string): string {
	return `${schemaBase}/${file}`;
}

function listJson(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".json"))
		.map((name) => path.join(dir, name));
}

function migrateTask(raw: Record<string, unknown>): Record<string, unknown> {
	const next = { ...raw };
	if (typeof next.number === "number" && next.order === undefined) {
		next.order = next.number;
	}
	delete next.number;
	if (!Array.isArray(next.subtasks)) {
		next.subtasks = [];
	}
	next.$schema = schemaRef("task.schema.json");
	return next;
}

function migrateDeliverable(
	raw: Record<string, unknown>,
): Record<string, unknown> {
	const next = { ...raw };
	delete next.number;
	if (!Array.isArray(next.subtasks)) {
		next.subtasks = [];
	}
	next.$schema = schemaRef("deliverable.schema.json");
	return next;
}

function migrateWorkstream(
	raw: Record<string, unknown>,
): Record<string, unknown> {
	return { ...raw, $schema: schemaRef("workstream.schema.json") };
}

function migrateVersion(raw: Record<string, unknown>): Record<string, unknown> {
	return { ...raw, $schema: schemaRef("version.schema.json") };
}

let tasksUpdated = 0;
let deliverablesUpdated = 0;

for (const versionId of listSeedVersionIds()) {
	const root = seedVersionDir(versionId);

	const versionPath = path.join(root, "version.json");
	if (fs.existsSync(versionPath)) {
		const version = migrateVersion(
			readJsonFile<Record<string, unknown>>(versionPath),
		);
		seedVersionSchema.parse(version);
		fs.writeFileSync(versionPath, `${JSON.stringify(version, null, 2)}\n`);
	}

	for (const file of listJson(path.join(root, "workstreams"))) {
		const ws = migrateWorkstream(readJsonFile<Record<string, unknown>>(file));
		seedWorkstreamSchema.parse(ws);
		fs.writeFileSync(file, `${JSON.stringify(ws, null, 2)}\n`);
	}

	for (const dir of ["deliverables", "milestones"] as const) {
		for (const file of listJson(path.join(root, dir))) {
			const deliverable = migrateDeliverable(
				readJsonFile<Record<string, unknown>>(file),
			);
			seedDeliverableSchema.parse(deliverable);
			fs.writeFileSync(file, `${JSON.stringify(deliverable, null, 2)}\n`);
			deliverablesUpdated += 1;
		}
	}

	for (const file of listJson(path.join(root, "tasks"))) {
		const task = migrateTask(readJsonFile<Record<string, unknown>>(file));
		seedTaskSchema.parse(task);
		fs.writeFileSync(file, `${JSON.stringify(task, null, 2)}\n`);
		tasksUpdated += 1;
	}
}

console.log(
	`Migrated ${tasksUpdated} tasks and ${deliverablesUpdated} deliverables under ${path.join(packageRoot, "data")}`,
);

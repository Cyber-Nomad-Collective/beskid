/**
 * Direct import of v0.4 seed JSON into SQLite tracker database.
 *
 * Uses the same import chain as the Settings UI (parseUploadedSeedBundles →
 * upsertParsedSeedBundles), reading files from disk as UploadedSeedFile
 * payloads.
 *
 * Run: tsx scripts/import-v04-seed.ts
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import {
	parseUploadedSeedBundles,
	type UploadedSeedFile,
} from "../src/lib/seed/parse-uploaded-bundle";
import { upsertParsedSeedBundles } from "../src/lib/tracker/import-catalog";

const DATA_ROOT = resolve(import.meta.dirname, "..", "data");
const V04_DIR = join(DATA_ROOT, "v0.4");

function collectFiles(dir: string): UploadedSeedFile[] {
	const files: UploadedSeedFile[] = [];

	function walk(current: string) {
		for (const entry of readdirSync(current)) {
			const full = join(current, entry);
			const stat = statSync(full);
			if (stat.isDirectory()) {
				walk(full);
			} else if (stat.isFile() && entry.endsWith(".json")) {
				let content = readFileSync(full, "utf8");
				const relPath = relative(DATA_ROOT, full);

				// --- In-memory patches for known seed-data issues (files left untouched) ---

				// v0.4/version.json: "In Progress (release closure)" → "In Progress"
				if (entry === "version.json" && relPath.startsWith("v0.4")) {
					content = content.replace(
						'"In Progress (release closure)"',
						'"In Progress"',
					);
				}

				// v0.4/tasks/corelib-matrix-green.json: "Substantially complete" → "Done"
				if (entry === "corelib-matrix-green.json" && relPath.startsWith("v0.4")) {
					content = content.replace('"Substantially complete"', '"Done"');
				}

				files.push({ relativePath: relPath, content });
			}
		}
	}

	walk(V04_DIR);
	return files;
}

console.log("Collecting v0.4 seed files from disk...");
const files = collectFiles(V04_DIR);
console.log(`  Found ${files.length} JSON files`);

console.log("Parsing seed bundles...");
const bundles = parseUploadedSeedBundles(files);
console.log(
	`  Parsed ${bundles.length} bundle(s): ${bundles.map((b) => `${b.versionId} (${b.tasks.length} tasks, ${b.workstreams.length} workstreams, ${b.deliverables.length} deliverables)`).join(", ")}`,
);

console.log("Importing into SQLite...");
const summary = upsertParsedSeedBundles(bundles);

console.log("\nImport summary:");
console.log(`  Versions upserted:   ${summary.versionsUpserted}`);
console.log(`  Workstreams upserted: ${summary.workstreamsUpserted}`);
console.log(`  Deliverables upserted: ${summary.deliverablesUpserted}`);
console.log(`  Tasks upserted:      ${summary.tasksUpserted}`);
console.log(`  Conflicts:           ${summary.conflicts}`);
console.log(`  Stale:               ${summary.stale}`);

console.log("\nDone. v0.4 seed imported into SQLite.");

#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const catalogPath = path.join(repoRoot, "openspec/catalog.json");
const legacyRoot = path.join(repoRoot, "site/spec-content");

type UnknownRecord = Record<string, unknown>;

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function sha256(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as UnknownRecord;
const entries = catalog.entries as UnknownRecord[];
const documents = (catalog.documents as UnknownRecord[]) ?? [];
const artifacts = (catalog.legacyArtifacts as UnknownRecord[]) ?? [];
const requirements = entries.flatMap((entry) => entry.requirements as UnknownRecord[]);
const records = entries.flatMap((entry) => entry.records as UnknownRecord[]);

assert(catalog.authority === "openspec/specs", "OpenSpec is not declared as the sole authority");
assert(catalog.migrationFinalized === true, "Migration is not finalized");
assert(!existsSync(legacyRoot), "Legacy site/spec-content still exists");
assert(entries.length > 0 && requirements.length > 0, "Catalog is empty");
assert(new Set(entries.map((entry) => entry.id)).size === entries.length, "Duplicate capability IDs");
assert(new Set(requirements.map((item) => item.id)).size === requirements.length, "Duplicate requirement IDs");
assert(new Set(records.map((item) => item.id)).size === records.length, "Duplicate source record IDs");
assert(new Set(artifacts.map((item) => item.path)).size === artifacts.length, "Duplicate archived artifact paths");
assert(!requirements.some((item) => item.migrationStatus === "needs-semantic-review"), "Unreviewed migration requirements remain");

for (const entry of entries) {
	const specPath = path.join(repoRoot, String(entry.specPath));
	assert(existsSync(specPath), `Missing canonical spec ${entry.specPath}`);
	const aliases = new Set((entry.legacySlugs as string[]) ?? []);
	for (const record of (entry.records as UnknownRecord[]) ?? []) {
		assert(aliases.has(String(record.legacySlug)), `Missing legacy alias ${record.legacySlug}`);
	}
}

for (const document of documents) {
	const documentPath = path.join(repoRoot, String(document.path));
	if (!existsSync(documentPath)) continue;
	assert(document.authority === "informative", `Document is not informative: ${document.path}`);
	assert(document.disposition === "informative-by-policy", `Document lacks authority disposition: ${document.path}`);
	assert(document.sourceHash === sha256(readFileSync(documentPath, "utf8")), `Document catalog drift: ${document.path}`);
}

for (const asset of [
	"compiler-build-pipeline.json",
	"compiler-mod-host-flow.json",
	"compiler-mods.json",
	"execution-stack.json",
	"syntax-railroad.json",
]) {
	assert(existsSync(path.join(repoRoot, "openspec/assets/architecture", asset)), `Missing architecture asset ${asset}`);
}

console.log(`Canonical Beskid standard valid: ${entries.length} capabilities, ${requirements.length} requirements, ${records.length} archived source records, ${artifacts.length} archived artifact hashes.`);

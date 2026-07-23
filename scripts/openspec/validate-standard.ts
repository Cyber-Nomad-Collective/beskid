#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { resolveDocumentIdentityFromPath } from "../../site/platform-spec/src/lib/spec/document-identity.ts";
import { deriveBookLinks } from "./validate-book-traceability.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const catalogPath = path.join(repoRoot, "openspec/catalog.json");
const specsRoot = path.join(repoRoot, "openspec/specs");
const legacyRoot = path.join(repoRoot, "site/spec-content");
const archiveTbdPurpose =
	"TBD - created by archiving change migrate-beskid-standard-to-openspec. Update Purpose after archive.";

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
const specDocuments = (catalog.specDocuments as UnknownRecord[]) ?? [];

assert(catalog.authority === "openspec/specs", "OpenSpec is not declared as the sole authority");
assert(catalog.migrationFinalized === true, "Migration is not finalized");
assert(!existsSync(legacyRoot), "Legacy site/spec-content still exists");
assert(entries.length > 0 && requirements.length > 0, "Catalog is empty");
assert(new Set(entries.map((entry) => entry.id)).size === entries.length, "Duplicate capability IDs");
assert(new Set(requirements.map((item) => item.id)).size === requirements.length, "Duplicate requirement IDs");
assert(new Set(records.map((item) => item.id)).size === records.length, "Duplicate source record IDs");
assert(new Set(artifacts.map((item) => item.path)).size === artifacts.length, "Duplicate archived artifact paths");
assert(!requirements.some((item) => item.migrationStatus === "needs-semantic-review"), "Unreviewed migration requirements remain");
assert(specDocuments.length > 0, "Canonical Platform Spec document catalog is empty");

const documentKinds = new Set([
	"taxonomy-domain",
	"taxonomy-area",
	"feature",
	"article",
	"decision",
]);
const documentsByKey = new Map(
	specDocuments.map((document) => [String(document.key), document]),
);
assert(
	documentsByKey.size === specDocuments.length,
	"Duplicate canonical Platform Spec document keys",
);
for (const document of specDocuments) {
	const kind = String(document.kind ?? "");
	assert(
		documentKinds.has(kind),
		`Unknown Platform Spec document kind: ${kind || "(missing)"}`,
	);
	const canonicalPath = String(document.canonicalPath ?? "");
	const identity = resolveDocumentIdentityFromPath(canonicalPath);
	for (const field of [
		"kind",
		"key",
		"capability",
		"parentCapability",
		"authority",
		"disposition",
		"layout",
	] as const) {
		assert(
			document[field] === identity[field],
			`Platform Spec document ${field} mismatch: ${canonicalPath}`,
		);
	}
	const parentCapability = String(document.parentCapability ?? "");
	if (kind === "taxonomy-domain") {
		assert(
			parentCapability === "platform-spec",
			`Platform Spec taxonomy-domain parent mismatch: ${canonicalPath}`,
		);
	} else {
		const parent = documentsByKey.get(parentCapability);
		assert(
			parent != null,
			`Platform Spec document has no canonical parent capability: ${canonicalPath}`,
		);
		if (kind === "article" || kind === "decision") {
			assert(
				parent.kind === "feature",
				`Platform Spec informative document parent is not a feature: ${canonicalPath}`,
			);
			assert(
				document.authority === "informative",
				`Platform Spec document is not informative: ${canonicalPath}`,
			);
		}
	}
	const absolutePath = path.join(repoRoot, canonicalPath);
	assert(existsSync(absolutePath), `Missing canonical document ${canonicalPath}`);
	assert(
		document.sourceHash === sha256(readFileSync(absolutePath, "utf8")),
		`Platform Spec document catalog drift: ${canonicalPath}`,
	);
}

for (const entry of entries) {
	const specPath = path.join(repoRoot, String(entry.specPath));
	assert(existsSync(specPath), `Missing canonical spec ${entry.specPath}`);
	const aliases = new Set((entry.legacySlugs as string[]) ?? []);
	for (const record of (entry.records as UnknownRecord[]) ?? []) {
		assert(aliases.has(String(record.legacySlug)), `Missing legacy alias ${record.legacySlug}`);
	}
}

for (const capabilityDir of readdirSync(specsRoot, { withFileTypes: true })) {
	if (!capabilityDir.isDirectory()) continue;
	const specPath = path.join(specsRoot, capabilityDir.name, "spec.md");
	if (!existsSync(specPath)) continue;
	const body = readFileSync(specPath, "utf8");
	assert(
		!body.includes(archiveTbdPurpose),
		`Archive TBD Purpose placeholder remains in ${path.relative(repoRoot, specPath)}`,
	);
}

for (const document of documents) {
	const documentPath = path.join(repoRoot, String(document.path));
	if (!existsSync(documentPath)) continue;
	assert(document.authority === "informative", `Document is not informative: ${document.path}`);
	assert(document.disposition === "informative-by-policy", `Document lacks authority disposition: ${document.path}`);
	assert(document.sourceHash === sha256(readFileSync(documentPath, "utf8")), `Document catalog drift: ${document.path}`);
}

const expectedBookLinks = deriveBookLinks({ entries, documents });
for (const entry of entries) {
	const capability = String(entry.capability);
	const actualBookLinks = (entry.bookLinks as string[] | undefined) ?? [];
	assert(
		JSON.stringify(actualBookLinks) === JSON.stringify(expectedBookLinks[capability] ?? []),
		`Book traceability catalog drift: ${capability}`,
	);
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

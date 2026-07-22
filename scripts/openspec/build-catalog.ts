#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
	resolveDocumentIdentityFromPath,
	type SpecDocumentIdentity,
} from "../../site/platform-spec/src/lib/spec/document-identity.ts";
import { deriveBookLinks } from "./validate-book-traceability.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const catalogPath = path.join(repoRoot, "openspec/catalog.json");

type UnknownRecord = Record<string, unknown>;

function sha256(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

function stableId(prefix: string, value: string): string {
	return `${prefix}-${sha256(value).slice(0, 12).toUpperCase()}`;
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 96);
}

function requirementTitles(markdown: string): string[] {
	return [...markdown.matchAll(/^### Requirement:\s*(.+)$/gm)].map((match) => match[1].trim());
}

function standardLinks(markdown: string): string[] {
	return [
		...new Set(
			[...markdown.matchAll(/\]\((\/platform-spec\/[^\s)#?]*\/?)(?:#[^)]+)?\)/g)].map((match) => match[1]),
		),
	];
}

function displayTitle(capability: string): string {
	return capability
		.split("--")
		.at(-1)!
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function titleFromMarkdown(markdown: string, fallback: string): string {
	return markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? fallback;
}

function canonicalCapabilityIdentity(
	entry: UnknownRecord,
): SpecDocumentIdentity | null {
	const capability = String(entry.capability ?? "");
	const declaredLevel = String(entry.specLevel ?? "");
	if (!capability) return null;
	if (declaredLevel === "domain" && !capability.startsWith("taxonomy--")) {
		throw new Error(
			`domain artifact must use taxonomy--<domain>: ${capability}`,
		);
	}
	if (declaredLevel === "area" && !capability.startsWith("taxonomy--")) {
		throw new Error(
			`area artifact must use taxonomy--<domain>--<area>: ${capability}`,
		);
	}
	if (!capability.startsWith("taxonomy--") && capability.split("--").length !== 3) {
		return null;
	}
	return resolveDocumentIdentityFromPath(
		`openspec/specs/${capability}/spec.md`,
	);
}

function platformSpecDocumentPaths(directory: string): string[] {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true })
		.flatMap((entry) => {
			const child = path.join(directory, entry.name);
			if (entry.isDirectory()) return platformSpecDocumentPaths(child);
			return entry.isFile() && entry.name.endsWith(".md") ? [child] : [];
		})
		.sort();
}

function catalogDocument(
	identity: SpecDocumentIdentity,
	markdown: string,
	metadata: UnknownRecord = {},
): UnknownRecord {
	return {
		id: metadata.id ?? identity.key,
		key: identity.key,
		kind: identity.kind,
		canonicalPath: identity.canonicalPath,
		publicSlug: identity.publicSlug,
		href: identity.href,
		capability: identity.capability,
		parentCapability: identity.parentCapability,
		layout: identity.layout,
		specLevel: identity.specLevel,
		authority: identity.authority,
		disposition: identity.disposition,
		domain: identity.domain,
		area: identity.area,
		feature: identity.feature,
		article: identity.article,
		decision: identity.decision,
		title:
			metadata.title ??
			titleFromMarkdown(markdown, displayTitle(identity.key)),
		status: metadata.status ?? null,
		sourceHash: sha256(markdown),
	};
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as UnknownRecord;
const entries = catalog.entries as UnknownRecord[];
const knownCapabilities = new Set(entries.map((entry) => String(entry.capability)));
const specsRoot = path.join(repoRoot, "openspec/specs");
const platformSpecDocumentsRoot = path.join(
	repoRoot,
	"openspec/documents/platform-spec",
);

for (const directory of readdirSync(specsRoot, { withFileTypes: true })) {
	if (!directory.isDirectory() || knownCapabilities.has(directory.name)) continue;
	const relativeSpecPath = `openspec/specs/${directory.name}/spec.md`;
	if (!existsSync(path.join(repoRoot, relativeSpecPath))) continue;
	const taxonomy = directory.name.split("--");
	entries.push({
		id: stableId("BSP-CAP", directory.name),
		capability: directory.name,
		specPath: relativeSpecPath,
		path: `/platform-spec/capabilities/${directory.name}/`,
		title: displayTitle(directory.name),
		description: `Canonical OpenSpec capability for ${displayTitle(directory.name)}.`,
		status: "Standard",
		domain: taxonomy[0],
		area: taxonomy[1] ?? null,
		feature: taxonomy.at(-1),
		legacySlugs: [],
		aliases: [],
		requirements: [],
		records: [],
	});
}

entries.sort((left, right) => String(left.capability).localeCompare(String(right.capability)));
const revisionInputs: string[] = [];

for (const entry of entries) {
	const capability = String(entry.capability);
	const specPath = path.join(repoRoot, String(entry.specPath));
	if (!existsSync(specPath)) throw new Error(`Missing canonical spec: ${specPath}`);
	const markdown = readFileSync(specPath, "utf8");
	const specHash = sha256(markdown);
	revisionInputs.push(`${entry.specPath}:${specHash}`);
	const existing = new Map(
		((entry.requirements as UnknownRecord[]) ?? []).map((item) => [String(item.title), item]),
	);
	entry.requirements = requirementTitles(markdown).map((title) => {
		const current = existing.get(title);
		return {
			...(current ?? {
				id: stableId("BSP-REQ", `${capability}#${title}`),
				legacySlug: null,
				sourcePath: String(entry.specPath),
				sourceHash: specHash,
				status: entry.status ?? "Proposed",
				normative: true,
				migrationStatus: "extracted",
			}),
			title,
			anchor: slugify(`requirement-${title}`),
		};
	});
}

const documents = ((catalog.documents as UnknownRecord[]) ?? []).filter((document) =>
	!String(document.path).startsWith("openspec/documents/platform-spec/") &&
	existsSync(path.join(repoRoot, String(document.path))),
);
catalog.documents = documents;
for (const document of documents) {
	const absolute = path.join(repoRoot, String(document.path));
	const markdown = readFileSync(absolute, "utf8");
	const hash = sha256(markdown);
	document.sourceHash = hash;
	if (String(document.path).startsWith("site/website/src/content/docs/book/")) {
		document.standardLinks = standardLinks(markdown);
	}
	revisionInputs.push(`${document.path}:${hash}`);
}

const specDocuments: UnknownRecord[] = [];
const featureCapabilities = new Set<string>();
for (const entry of entries) {
	const identity = canonicalCapabilityIdentity(entry);
	if (!identity) continue;
	if (String(entry.specPath) !== identity.canonicalPath) {
		throw new Error(
			`Invalid canonical path for ${identity.capability}: ${String(entry.specPath)}`,
		);
	}
	const markdown = readFileSync(path.join(repoRoot, identity.canonicalPath), "utf8");
	specDocuments.push(catalogDocument(identity, markdown, entry));
	if (identity.kind === "feature") featureCapabilities.add(identity.capability);
}

for (const absolutePath of platformSpecDocumentPaths(platformSpecDocumentsRoot)) {
	const canonicalPath = path.relative(repoRoot, absolutePath).split(path.sep).join("/");
	const identity = resolveDocumentIdentityFromPath(canonicalPath);
	if (!featureCapabilities.has(identity.parentCapability)) {
		throw new Error(
			`Missing feature parent ${identity.parentCapability} for ${canonicalPath}`,
		);
	}
	const markdown = readFileSync(absolutePath, "utf8");
	specDocuments.push(catalogDocument(identity, markdown));
	const hash = sha256(markdown);
	revisionInputs.push(`${canonicalPath}:${hash}`);
}

const documentKindOrder = new Map([
	["taxonomy-domain", 0],
	["taxonomy-area", 1],
	["feature", 2],
	["article", 3],
	["decision", 4],
]);
catalog.specDocuments = specDocuments.sort(
	(left, right) =>
		(documentKindOrder.get(String(left.kind)) ?? Number.MAX_SAFE_INTEGER) -
			(documentKindOrder.get(String(right.kind)) ?? Number.MAX_SAFE_INTEGER) ||
		String(left.key).localeCompare(String(right.key)),
);

const bookLinksByCapability = deriveBookLinks({ entries, documents });
for (const entry of entries) {
	entry.bookLinks = bookLinksByCapability[String(entry.capability)] ?? [];
}

const requirements = entries.flatMap((entry) => entry.requirements as UnknownRecord[]);
const records = entries.flatMap((entry) => (entry.records as UnknownRecord[]) ?? []);
catalog.generatedBy = "scripts/openspec/build-catalog.ts";
catalog.authority = "openspec/specs";
catalog.migrationFinalized = true;
catalog.revision = sha256(revisionInputs.sort().join("\n"));
catalog.stats = {
	...(catalog.stats as UnknownRecord),
	capabilities: entries.length,
	requirements: requirements.length,
	nodes: records.length,
	provisionalCapabilities: entries.filter((entry) =>
		(entry.requirements as UnknownRecord[]).some(
			(item) => item.migrationStatus === "provisional-capability",
		),
	).length,
	informativeDocuments: documents.length,
	specDocuments: specDocuments.length,
};

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`OpenSpec catalog rebuilt: ${entries.length} capabilities, ${requirements.length} requirements, revision ${String(catalog.revision).slice(0, 12)}.`);

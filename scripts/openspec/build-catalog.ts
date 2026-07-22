#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

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

function platformSpecDocumentIdentity(documentPath: string): { kind: string; parentCapability: string } | null {
	const match = documentPath.match(
		/^openspec\/documents\/platform-spec\/([^/]+)\/(articles|decisions)\/[^/]+\.md$/,
	);
	if (!match) return null;
	return {
		kind: match[2] === "articles" ? "article" : "decision",
		parentCapability: match[1],
	};
}

function platformSpecDocuments(directory: string, relativePath = ""): string[] {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const childRelativePath = path.join(relativePath, entry.name);
		const childPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return platformSpecDocuments(childPath, childRelativePath);
		return entry.isFile() && entry.name.endsWith(".md") ? [childRelativePath] : [];
	});
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as UnknownRecord;
const entries = catalog.entries as UnknownRecord[];
const knownCapabilities = new Set(entries.map((entry) => String(entry.capability)));
const specsRoot = path.join(repoRoot, "openspec/specs");
const platformSpecDocumentsRoot = path.join(repoRoot, "openspec/documents/platform-spec");

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
		specLevel: "feature",
		parentCapability: `taxonomy--${taxonomy.slice(0, 2).join("--")}`,
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
	existsSync(path.join(repoRoot, String(document.path))),
);
const knownDocuments = new Set(documents.map((document) => String(document.path)));
for (const relativePath of platformSpecDocuments(platformSpecDocumentsRoot)) {
	const documentPath = `openspec/documents/platform-spec/${relativePath.replaceAll(path.sep, "/")}`;
	if (knownDocuments.has(documentPath)) continue;
	const identity = platformSpecDocumentIdentity(documentPath);
	if (!identity) continue;
	const markdown = readFileSync(path.join(repoRoot, documentPath), "utf8");
	documents.push({
		path: documentPath,
		title: titleFromMarkdown(markdown, displayTitle(identity.parentCapability)),
		kind: identity.kind,
		parentCapability: identity.parentCapability,
		authority: "informative",
		disposition: "informative-by-policy",
		standardLinks: [],
	});
}
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
};

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`OpenSpec catalog rebuilt: ${entries.length} capabilities, ${requirements.length} requirements, revision ${String(catalog.revision).slice(0, 12)}.`);

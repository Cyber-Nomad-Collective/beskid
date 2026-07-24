// Pure OpenSpec catalog reader. OpenSpec is the native shape: capabilities live
// in openspec/specs/<domain--area--feature>/spec.md and are indexed by
// openspec/catalog.json. This module has no server-only or database imports so
// it runs both inside the TanStack server bundle and under the Node seed runner.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
	resolveCapabilityDocumentIdentity,
	resolveDocumentIdentityFromPath,
	type SpecDocumentIdentity,
	type SpecDocumentKind,
} from "#/lib/spec/document-identity";

export interface OpenSpecRequirement {
	id: string;
	anchor: string;
	title: string;
	markdown: string;
}

interface OpenSpecCatalogDocumentBase {
	id: string;
	kind: SpecDocumentKind;
	identity: SpecDocumentIdentity;
	key: string;
	capability: string;
	slug: string;
	href: string;
	title: string;
	description: string | null;
	status: string | null;
	pathClass: string;
	specLevel: string;
	layout: string;
	canonicalPath: string;
	parentCapability: string;
	parentSlug: string | null;
	authority: "normative" | "informative";
	disposition:
		| "provisional-taxonomy"
		| "normative-standard"
		| "informative-by-policy";
	sourceHash: string;
	domain: string;
	area: string | null;
	feature: string | null;
	article: string | null;
	decision: string | null;
	specPath: string;
	legacySlugs: string[];
	/** Informative Book guides; OpenSpec remains the normative source. */
	bookLinks: string[];
	requirements: OpenSpecRequirement[];
}

export type OpenSpecCatalogDocument =
	| (OpenSpecCatalogDocumentBase & {
			kind: "taxonomy-domain";
			area: null;
			feature: null;
	  })
	| (OpenSpecCatalogDocumentBase & {
			kind: "taxonomy-area";
			area: string;
			feature: null;
	  })
	| (OpenSpecCatalogDocumentBase & {
			kind: "feature";
			area: string;
			feature: string;
	  })
	| (OpenSpecCatalogDocumentBase & {
			kind: "article";
			area: string;
			feature: string;
			article: string;
	  })
	| (OpenSpecCatalogDocumentBase & {
			kind: "decision";
			area: string;
			feature: string;
			decision: string;
	  });

export interface OpenSpecLegacyCatalogEntry
	extends Omit<
		OpenSpecCatalogDocumentBase,
		"kind" | "identity" | "domain" | "area" | "feature" | "article" | "decision"
	> {
	kind: "legacy-capability";
	identity: null;
	domain: null;
	area: null;
	feature: null;
	article: null;
	decision: null;
}

export type OpenSpecCatalogEntry =
	| OpenSpecCatalogDocument
	| OpenSpecLegacyCatalogEntry;

export interface OpenSpecCatalog {
	version: number;
	revision: string;
	generatedAt: string;
	documents: OpenSpecCatalogDocument[];
	legacyEntries: OpenSpecLegacyCatalogEntry[];
	/** Reader compatibility surface; canonical consumers use `documents`. */
	entries: OpenSpecCatalogEntry[];
}

type UnknownRecord = Record<string, unknown>;

const REQUIREMENT_HEADING = /^### Requirement:\s*(.+)$/gm;

function isRecord(value: unknown): value is UnknownRecord {
	return value != null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.map(asString).filter((item): item is string => item != null);
}

function capabilityTitle(capability: string): string {
	return (capability.split("--").at(-1) ?? capability)
		.replace(/-/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sha256(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

export function anchorFor(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function normalizeLegacySlug(value: string): string {
	const withoutOrigin = value.replace(/^https?:\/\/[^/]+/i, "");
	const clean = withoutOrigin.replace(/^\/+|\/+$/g, "");
	return clean.startsWith("platform-spec/") || clean === "platform-spec"
		? clean
		: `platform-spec/${clean}`;
}

function stripHtmlComments(value: string): string {
	let previous: string;
	let current = value;
	do {
		previous = current;
		// Remove HTML comments, accepting both the "-->" and legacy "--!>"
		// terminators and treating an unterminated "<!--" as running to the end
		// of the string. Re-run until the string stabilises so a removal that
		// exposes a fresh "<!--" cannot slip through. Because every "<!--" is
		// matched (at worst up to end-of-string), the result can never still
		// contain "<!--".
		current = current.replace(/<!--[\s\S]*?(?:--!?>|$)/g, "");
	} while (current !== previous);
	return current;
}

function extractPurpose(markdown: string): string | null {
	const match = markdown.match(/^## Purpose\s*\n+([\s\S]*?)(?=\n## |$)/m);
	if (!match) return null;
	return stripHtmlComments(match[1]).replace(/\s+/g, " ").trim() || null;
}

export function extractRequirements(markdown: string): OpenSpecRequirement[] {
	const matches = [...markdown.matchAll(REQUIREMENT_HEADING)];
	return matches.map((match, index) => {
		const title = match[1].trim();
		const start = match.index ?? 0;
		const end = matches[index + 1]?.index ?? markdown.length;
		return {
			id: anchorFor(title),
			anchor: anchorFor(title),
			title,
			markdown: markdown.slice(start, end).trim(),
		};
	});
}

function mergeRequirementMetadata(
	parsed: OpenSpecRequirement[],
	raw: UnknownRecord,
): OpenSpecRequirement[] {
	if (!Array.isArray(raw.requirements)) return parsed;
	const metadata = raw.requirements.filter(isRecord);
	return parsed.map((requirement, index) => {
		const item = metadata[index];
		if (!item) return requirement;
		return {
			...requirement,
			id: asString(item.id) ?? requirement.id,
			anchor: asString(item.anchor) ?? requirement.anchor,
		};
	});
}

export function resolveOpenSpecRoot(): string {
	if (process.env.OPENSPEC_ROOT?.trim()) {
		return path.resolve(process.env.OPENSPEC_ROOT);
	}
	const repoRoot = process.env.BESKID_REPO_ROOT?.trim()
		? path.resolve(process.env.BESKID_REPO_ROOT)
		: path.resolve(import.meta.dirname, "../../../../..");
	return path.join(repoRoot, "openspec");
}

function rawCatalogEntries(raw: UnknownRecord): UnknownRecord[] {
	const entries = Array.isArray(raw.entries)
		? raw.entries
		: Array.isArray(raw.capabilities)
			? raw.capabilities
			: [];
	return entries.filter(isRecord);
}

function discoverCapabilities(specsRoot: string): UnknownRecord[] {
	if (!fs.existsSync(specsRoot)) return [];
	return fs
		.readdirSync(specsRoot, { withFileTypes: true })
		.filter(
			(entry) =>
				entry.isDirectory() &&
				fs.existsSync(path.join(specsRoot, entry.name, "spec.md")),
		)
		.map((entry) => ({
			id: entry.name,
			capability: entry.name,
			specPath: `specs/${entry.name}/spec.md`,
		}));
}

function artifactInputForCapability(
	raw: UnknownRecord,
): SpecDocumentIdentity | null {
	const capability =
		asString(raw.capability) ?? asString(raw.stableId) ?? asString(raw.id);
	if (!capability) return null;
	return resolveCapabilityDocumentIdentity({
		capability,
		specLevel: asString(raw.specLevel),
	});
}

function entryAliases(raw: UnknownRecord, topAliases: UnknownRecord): string[] {
	const direct = [
		...asStringArray(raw.legacySlugs),
		...asStringArray(raw.aliases),
		...asStringArray(raw.legacyPaths),
	];
	const id = asString(raw.id) ?? asString(raw.capability);
	for (const [alias, target] of Object.entries(topAliases)) {
		if (asString(target) === id) direct.push(alias);
	}
	return [...new Set(direct.map(normalizeLegacySlug))];
}

function loadEntry(
	openSpecRoot: string,
	raw: UnknownRecord,
	topAliases: UnknownRecord,
): OpenSpecCatalogEntry | null {
	const identity = artifactInputForCapability(raw);
	if (!identity) return null;
	const configuredPath = asString(raw.specPath) ?? asString(raw.file);
	if (
		configuredPath &&
		`openspec/${configuredPath.replace(/^openspec\//, "")}` !==
			identity.canonicalPath
	) {
		throw new Error(
			`Invalid canonical path for ${identity.capability}: ${configuredPath}`,
		);
	}
	const absoluteSpecPath = path.join(
		openSpecRoot,
		identity.canonicalPath.replace(/^openspec\//, ""),
	);
	if (!fs.existsSync(absoluteSpecPath)) return null;
	const markdown = fs.readFileSync(absoluteSpecPath, "utf8");
	const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
	const aliases = entryAliases(raw, topAliases);
	const configuredPublicPath = asString(raw.path);
	if (
		configuredPublicPath?.startsWith("/platform-spec/") &&
		normalizeLegacySlug(configuredPublicPath) !== identity.publicSlug
	) {
		aliases.push(normalizeLegacySlug(configuredPublicPath));
	}
	return {
		...identity,
		identity,
		id: asString(raw.id) ?? identity.key,
		slug: identity.publicSlug,
		title: asString(raw.title) ?? heading ?? capabilityTitle(identity.capability),
		description: asString(raw.description) ?? extractPurpose(markdown),
		status: asString(raw.status) ?? "Standard",
		pathClass: identity.artifactKind,
		sourceHash: sha256(markdown),
		specPath: path
			.relative(openSpecRoot, absoluteSpecPath)
			.split(path.sep)
			.join("/"),
		legacySlugs: [...new Set(aliases)],
		bookLinks: asStringArray(raw.bookLinks),
		requirements: mergeRequirementMetadata(extractRequirements(markdown), raw),
	} as OpenSpecCatalogEntry;
}

function loadLegacyEntry(
	openSpecRoot: string,
	raw: UnknownRecord,
	topAliases: UnknownRecord,
): OpenSpecLegacyCatalogEntry | null {
	const capability =
		asString(raw.capability) ?? asString(raw.stableId) ?? asString(raw.id);
	if (!capability || artifactInputForCapability(raw)) return null;
	const configuredPath =
		asString(raw.specPath) ?? asString(raw.file) ?? `specs/${capability}/spec.md`;
	const canonicalPath = `openspec/${configuredPath.replace(/^openspec\//, "")}`;
	const absoluteSpecPath = path.resolve(
		openSpecRoot,
		canonicalPath.replace(/^openspec\//, ""),
	);
	if (!absoluteSpecPath.startsWith(`${path.resolve(openSpecRoot)}${path.sep}`)) {
		throw new Error(
			`Legacy capability path escapes OpenSpec root: ${configuredPath}`,
		);
	}
	if (!fs.existsSync(absoluteSpecPath)) return null;
	const markdown = fs.readFileSync(absoluteSpecPath, "utf8");
	const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
	const configuredPublicPath = asString(raw.path);
	const publicSlug = configuredPublicPath?.startsWith("/platform-spec/")
		? configuredPublicPath.replace(/^\/+|\/+$/g, "")
		: `platform-spec/capabilities/${capability}`;
	return {
		kind: "legacy-capability",
		identity: null,
		id: asString(raw.id) ?? capability,
		key: capability,
		capability,
		slug: publicSlug,
		href: `/${publicSlug}/`,
		title: asString(raw.title) ?? heading ?? capabilityTitle(capability),
		description: asString(raw.description) ?? extractPurpose(markdown),
		status: asString(raw.status) ?? "Standard",
		pathClass: "legacy-capability",
		specLevel: asString(raw.specLevel) ?? "feature",
		layout: asString(raw.layout) ?? "feature",
		canonicalPath,
		parentCapability: "platform-spec",
		parentSlug: "platform-spec",
		authority: "normative",
		disposition: "normative-standard",
		sourceHash: sha256(markdown),
		domain: null,
		area: null,
		feature: null,
		article: null,
		decision: null,
		specPath: path
			.relative(openSpecRoot, absoluteSpecPath)
			.split(path.sep)
			.join("/"),
		legacySlugs: entryAliases(raw, topAliases),
		bookLinks: asStringArray(raw.bookLinks),
		requirements: mergeRequirementMetadata(extractRequirements(markdown), raw),
	};
}

function discoverPlatformSpecDocuments(openSpecRoot: string): string[] {
	const root = path.join(openSpecRoot, "documents", "platform-spec");
	if (!fs.existsSync(root)) return [];
	const visit = (directory: string): string[] =>
		fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
			const child = path.join(directory, entry.name);
			if (entry.isDirectory()) return visit(child);
			return entry.isFile() && entry.name.endsWith(".md") ? [child] : [];
		});
	return visit(root).sort();
}

function loadInformativeDocument(
	openSpecRoot: string,
	absolutePath: string,
): OpenSpecCatalogDocument {
	const identity = resolveDocumentIdentityFromPath(
		`openspec/${path.relative(openSpecRoot, absolutePath).split(path.sep).join("/")}`,
	);
	const markdown = fs.readFileSync(absolutePath, "utf8");
	const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
	return {
		...identity,
		identity,
		id: identity.key,
		slug: identity.publicSlug,
		title: heading ?? capabilityTitle(identity.key),
		description: extractPurpose(markdown),
		status: null,
		pathClass: identity.artifactKind,
		sourceHash: sha256(markdown),
		specPath: identity.canonicalPath.replace(/^openspec\//, ""),
		legacySlugs: [],
		bookLinks: [],
		requirements: [],
	} as OpenSpecCatalogDocument;
}

export function loadOpenSpecCatalog(
	openSpecRoot = resolveOpenSpecRoot(),
): OpenSpecCatalog {
	const catalogPath = path.join(openSpecRoot, "catalog.json");
	const raw = fs.existsSync(catalogPath)
		? JSON.parse(fs.readFileSync(catalogPath, "utf8"))
		: {};
	const catalog = isRecord(raw) ? raw : {};
	const aliases = isRecord(catalog.aliases) ? catalog.aliases : {};
	const configured = rawCatalogEntries(catalog);
	const discovered = discoverCapabilities(path.join(openSpecRoot, "specs"));
	const byCapability = new Map<string, UnknownRecord>();
	for (const entry of [...discovered, ...configured]) {
		const capability =
			asString(entry.capability) ?? asString(entry.stableId) ?? asString(entry.id);
		if (capability) byCapability.set(capability, entry);
	}
	const capabilityDocuments = [...byCapability.values()]
		.map((entry) => loadEntry(openSpecRoot, entry, aliases))
		.filter((entry): entry is OpenSpecCatalogDocument => entry != null);
	const legacyEntries = [...byCapability.values()]
		.map((entry) => loadLegacyEntry(openSpecRoot, entry, aliases))
		.filter((entry): entry is OpenSpecLegacyCatalogEntry => entry != null)
		.sort((left, right) => left.capability.localeCompare(right.capability));
	const featureCapabilities = new Set(
		capabilityDocuments
			.filter((document) => document.kind === "feature")
			.map((document) => document.capability),
	);
	const informativeDocuments = discoverPlatformSpecDocuments(openSpecRoot).map(
		(documentPath) => loadInformativeDocument(openSpecRoot, documentPath),
	);
	for (const document of informativeDocuments) {
		if (!featureCapabilities.has(document.parentCapability)) {
			throw new Error(
				`Missing feature parent ${document.parentCapability} for ${document.canonicalPath}`,
			);
		}
	}
	const kindOrder: Record<SpecDocumentKind, number> = {
		"taxonomy-domain": 0,
		"taxonomy-area": 1,
		feature: 2,
		article: 3,
		decision: 4,
	};
	const documents = [...capabilityDocuments, ...informativeDocuments].sort(
		(left, right) =>
			kindOrder[left.kind] - kindOrder[right.kind] ||
			left.key.localeCompare(right.key),
	);

	return {
		version:
			typeof catalog.schemaVersion === "number"
				? catalog.schemaVersion
				: typeof catalog.version === "number"
					? catalog.version
					: 1,
		revision:
			asString(catalog.revision) ??
			asString(catalog.sourceRevision) ??
			"working-tree",
		generatedAt: asString(catalog.generatedAt) ?? new Date(0).toISOString(),
		documents,
		legacyEntries,
		entries: [...documents, ...legacyEntries],
	};
}

export function resolveOpenSpecEntry(
	identifier: string,
	openSpecRoot = resolveOpenSpecRoot(),
	catalog?: OpenSpecCatalog,
): OpenSpecCatalogEntry | null {
	const clean = identifier.replace(/^\/+|\/+$/g, "");
	const resolved = catalog ?? loadOpenSpecCatalog(openSpecRoot);
	return (
		resolved.entries.find(
			(entry) =>
				entry.id === clean ||
				entry.key === clean ||
				entry.capability === clean ||
				entry.slug === clean ||
				entry.canonicalPath === clean ||
				entry.legacySlugs.includes(normalizeLegacySlug(clean)),
		) ?? null
	);
}

export function readEntryMarkdown(
	entry: OpenSpecCatalogEntry,
	openSpecRoot: string,
): string {
	return fs.readFileSync(
		path.join(openSpecRoot, entry.canonicalPath.replace(/^openspec\//, "")),
		"utf8",
	);
}

export function getOpenSpecEmbed(
	identifier: string,
	openSpecRoot = resolveOpenSpecRoot(),
	catalog?: OpenSpecCatalog,
): {
	entry: OpenSpecCatalogEntry;
	requirement: OpenSpecRequirement | null;
	markdown: string;
} | null {
	const [capabilityId, requirementId] = identifier.split("#", 2);
	const entry = resolveOpenSpecEntry(capabilityId, openSpecRoot, catalog);
	if (!entry) return null;
	const requirement = requirementId
		? (entry.requirements.find(
				(item) =>
					item.id === requirementId ||
					item.anchor === anchorFor(requirementId) ||
					anchorFor(item.title) === anchorFor(requirementId) ||
					item.title === requirementId,
			) ?? null)
		: null;
	if (requirementId && !requirement) return null;
	return {
		entry,
		requirement,
		markdown: requirement?.markdown ?? readEntryMarkdown(entry, openSpecRoot),
	};
}

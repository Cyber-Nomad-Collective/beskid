// Pure OpenSpec catalog reader. OpenSpec is the native shape: capabilities live
// in openspec/specs/<domain--area--feature>/spec.md and are indexed by
// openspec/catalog.json. This module has no server-only or database imports so
// it runs both inside the TanStack server bundle and under a raw `bun` seed run.

import fs from "node:fs";
import path from "node:path";

export interface OpenSpecRequirement {
	id: string;
	anchor: string;
	title: string;
	markdown: string;
}

export interface OpenSpecCatalogEntry {
	id: string;
	capability: string;
	slug: string;
	href: string;
	title: string;
	description: string | null;
	status: string | null;
	pathClass: string;
	specLevel: string;
	parentSlug: string | null;
	domain: string | null;
	area: string | null;
	feature: string | null;
	specPath: string;
	legacySlugs: string[];
	/** Informative Book guides; OpenSpec remains the normative source. */
	bookLinks: string[];
	requirements: OpenSpecRequirement[];
}

export interface OpenSpecCatalog {
	version: number;
	revision: string;
	generatedAt: string;
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
	return (
		stripHtmlComments(match[1])
			.replace(/\s+/g, " ")
			.trim() || null
	);
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
	const capability =
		asString(raw.capability) ?? asString(raw.stableId) ?? asString(raw.id);
	if (!capability) return null;
	const specPath =
		asString(raw.specPath) ??
		asString(raw.path) ??
		asString(raw.file) ??
		`specs/${capability}/spec.md`;
	const absoluteSpecPath = path.resolve(
		openSpecRoot,
		specPath.replace(/^openspec\//, ""),
	);
	if (!absoluteSpecPath.startsWith(path.resolve(openSpecRoot) + path.sep))
		return null;
	if (!fs.existsSync(absoluteSpecPath)) return null;
	const markdown = fs.readFileSync(absoluteSpecPath, "utf8");
	const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
	const publicPath = asString(raw.path);
	const slug = publicPath?.startsWith("/platform-spec/")
		? publicPath.replace(/^\/+|\/+$/g, "")
		: `platform-spec/capabilities/${capability}`;
	return {
		id: asString(raw.id) ?? capability,
		capability,
		slug,
		href: `/${slug}/`,
		title: asString(raw.title) ?? heading ?? capabilityTitle(capability),
		description: asString(raw.description) ?? extractPurpose(markdown),
		status: asString(raw.status) ?? "Standard",
		pathClass: "feature",
		specLevel: asString(raw.specLevel) ?? "feature",
		parentSlug: "platform-spec",
		domain: asString(raw.domain) ?? capability.split("--")[0] ?? null,
		area: asString(raw.area) ?? capability.split("--")[1] ?? null,
		feature: asString(raw.feature) ?? capability.split("--").at(-1) ?? null,
		specPath: path
			.relative(openSpecRoot, absoluteSpecPath)
			.split(path.sep)
			.join("/"),
		legacySlugs: entryAliases(raw, topAliases),
		bookLinks: asStringArray(raw.bookLinks),
		requirements: mergeRequirementMetadata(extractRequirements(markdown), raw),
	};
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
			asString(entry.capability) ??
			asString(entry.stableId) ??
			asString(entry.id);
		if (capability) byCapability.set(capability, entry);
	}
	const entries = [...byCapability.values()]
		.map((entry) => loadEntry(openSpecRoot, entry, aliases))
		.filter((entry): entry is OpenSpecCatalogEntry => entry != null)
		.sort((a, b) => a.capability.localeCompare(b.capability));

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
		entries,
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
				entry.capability === clean ||
				entry.slug === clean ||
				entry.legacySlugs.includes(normalizeLegacySlug(clean)),
		) ?? null
	);
}

export function readEntryMarkdown(
	entry: OpenSpecCatalogEntry,
	openSpecRoot: string,
): string {
	return fs.readFileSync(path.join(openSpecRoot, entry.specPath), "utf8");
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

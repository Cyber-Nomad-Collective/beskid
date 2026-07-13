import "@tanstack/react-start/server-only";

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

export interface OpenSpecNavNode {
	slug: string;
	href: string;
	title: string;
	level: "root" | "domain" | "area" | "feature" | "article";
	children?: OpenSpecNavNode[];
}

export interface OpenSpecDocumentBundle {
	slug: string;
	href: string;
	pathClass: string;
	title: string;
	description: string | null;
	status: string | null;
	specLevel: string;
	/** Informative Book guides; OpenSpec remains the normative source. */
	bookLinks: string[];
	frontmatter: {
		title: string;
		description: string | null;
		status: string | null;
		specLevel: string;
		capability: string;
		revision: string;
	};
	body: string;
	layoutJson: null;
	contentJson: null;
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

function anchorFor(title: string): string {
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

function extractPurpose(markdown: string): string | null {
	const match = markdown.match(/^## Purpose\s*\n+([\s\S]*?)(?=\n## |$)/m);
	if (!match) return null;
	return (
		match[1]
			.replace(/\s+/g, " ")
			.replace(/<!--.*?-->/g, "")
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
		specLevel: "feature",
		parentSlug: "platform-spec",
		domain: asString(raw.domain),
		area: asString(raw.area),
		feature: asString(raw.feature),
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
): OpenSpecCatalogEntry | null {
	const clean = identifier.replace(/^\/+|\/+$/g, "");
	const catalog = loadOpenSpecCatalog(openSpecRoot);
	return (
		catalog.entries.find(
			(entry) =>
				entry.id === clean ||
				entry.capability === clean ||
				entry.slug === clean ||
				entry.legacySlugs.includes(normalizeLegacySlug(clean)),
		) ?? null
	);
}

function readEntryMarkdown(
	entry: OpenSpecCatalogEntry,
	openSpecRoot: string,
): string {
	return fs.readFileSync(path.join(openSpecRoot, entry.specPath), "utf8");
}

export function getOpenSpecDocument(
	identifier: string,
	openSpecRoot = resolveOpenSpecRoot(),
): OpenSpecDocumentBundle | null {
	const entry = resolveOpenSpecEntry(identifier, openSpecRoot);
	if (!entry) return null;
	return {
		slug: entry.slug,
		href: entry.href,
		pathClass: entry.pathClass,
		title: entry.title,
		description: entry.description,
		status: entry.status,
		specLevel: entry.specLevel,
		bookLinks: entry.bookLinks,
		frontmatter: {
			title: entry.title,
			description: entry.description,
			status: entry.status,
			specLevel: entry.specLevel,
			capability: entry.capability,
			revision: loadOpenSpecCatalog(openSpecRoot).revision,
		},
		body: readEntryMarkdown(entry, openSpecRoot),
		layoutJson: null,
		contentJson: null,
	};
}

export function getOpenSpecNavTree(
	openSpecRoot = resolveOpenSpecRoot(),
): OpenSpecNavNode {
	const entries = loadOpenSpecCatalog(openSpecRoot).entries;
	const domains = new Map<string, Map<string, OpenSpecCatalogEntry[]>>();
	for (const entry of entries) {
		const domain =
			entry.domain ?? entry.capability.split("--")[0] ?? "standard";
		const area = entry.area ?? entry.capability.split("--")[1] ?? "general";
		const areas =
			domains.get(domain) ?? new Map<string, OpenSpecCatalogEntry[]>();
		const features = areas.get(area) ?? [];
		features.push(entry);
		areas.set(area, features);
		domains.set(domain, areas);
	}
	const title = (value: string) =>
		value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
	return {
		slug: "platform-spec",
		href: "/platform-spec/",
		title: "Platform specification",
		level: "root",
		children: [...domains.entries()].map(([domain, areas]) => {
			const first = [...areas.values()][0]?.[0];
			return {
				slug: `platform-spec/domain/${domain}`,
				href: first?.href ?? "/platform-spec/",
				title: title(domain),
				level: "domain",
				children: [...areas.entries()].map(([area, features]) => ({
					slug: `platform-spec/domain/${domain}/${area}`,
					href: features[0]?.href ?? "/platform-spec/",
					title: title(area),
					level: "area",
					children: features.map((entry) => ({
						slug: entry.slug,
						href: entry.href,
						title: entry.title,
						level: "feature",
					})),
				})),
			};
		}),
	};
}

export function getOpenSpecEmbed(
	identifier: string,
	openSpecRoot = resolveOpenSpecRoot(),
): {
	entry: OpenSpecCatalogEntry;
	requirement: OpenSpecRequirement | null;
	markdown: string;
} | null {
	const [capabilityId, requirementId] = identifier.split("#", 2);
	const entry = resolveOpenSpecEntry(capabilityId, openSpecRoot);
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

// Static generation of the native-shape spec workspace. `generateSeed` reads the
// OpenSpec authority once and emits a deterministic JSON workspace (the `seed/`
// directory) that the runtime serves without rescanning the filesystem and that
// the data seeders upsert into SQLite and Memgraph. Pure module (no server-only).

import fs from "node:fs";
import path from "node:path";

import {
	loadOpenSpecCatalog,
	type OpenSpecCatalog,
	resolveOpenSpecRoot,
} from "#/lib/spec/catalog";
import {
	type OpenSpecDocumentBundle,
	getOpenSpecDocument,
} from "#/lib/spec/document";
import {
	buildDomainModel,
	buildNavTree,
	type DomainAreaFeatureModel,
	type OpenSpecNavNode,
} from "#/lib/spec/domain-model";
import {
	type LayoutIndex,
	type LayoutValidation,
	loadLayoutRegistry,
	type SpecLayout,
} from "#/lib/spec/layouts";
import { resolveSeedDir } from "#/lib/spec/paths.core";

export const SEED_VERSION = 2;

export interface SeedMeta {
	version: number;
	revision: string;
	counts: {
		domains: number;
		areas: number;
		features: number;
		documents: number;
		capabilities: number;
		requirements: number;
	};
	layout: {
		checked: number;
		conforming: number;
		violations: number;
	};
}

export interface SeedLayouts {
	index: LayoutIndex | null;
	layouts: SpecLayout[];
	assignments: Record<string, string | null>;
	validations: Record<string, LayoutValidation>;
}

export interface SeedWorkspace {
	meta: SeedMeta;
	catalog: OpenSpecCatalog;
	navTree: OpenSpecNavNode;
	domainModel: DomainAreaFeatureModel;
	layouts: SeedLayouts;
	documents: Record<string, OpenSpecDocumentBundle>;
}

const FILES = {
	meta: "meta.json",
	catalog: "catalog.json",
	navTree: "nav-tree.json",
	domainModel: "domain-model.json",
	layouts: "layouts.json",
	documents: "documents.json",
} as const;

export interface LayoutFinding {
	capability: string;
	violations: LayoutValidation["violations"];
}

export interface GenerateSeedResult {
	workspace: SeedWorkspace;
	outDir: string;
	findings: LayoutFinding[];
}

function writeJson(dir: string, file: string, value: unknown): void {
	fs.writeFileSync(path.join(dir, file), `${JSON.stringify(value, null, 2)}\n`);
}

export function buildSeedWorkspace(
	openSpecRoot = resolveOpenSpecRoot(),
): { workspace: SeedWorkspace; findings: LayoutFinding[] } {
	const catalog = loadOpenSpecCatalog(openSpecRoot);
	const registry = loadLayoutRegistry(openSpecRoot);
	const domainModel = buildDomainModel(catalog);
	const navTree = buildNavTree(catalog);

	const documents: Record<string, OpenSpecDocumentBundle> = {};
	const assignments: Record<string, string | null> = {};
	const validations: Record<string, LayoutValidation> = {};
	const findings: LayoutFinding[] = [];
	let requirementCount = 0;
	let conforming = 0;

	for (const entry of catalog.documents) {
		const bundle = getOpenSpecDocument(entry.key, openSpecRoot, {
			catalog,
			registry,
		});
		if (!bundle) {
			throw new Error(
				`Unable to build document bundle for ${entry.capability}`,
			);
		}
		documents[entry.slug] = bundle;
		assignments[entry.key] = bundle.layoutValidation.layoutId;
		validations[entry.key] = bundle.layoutValidation;
		requirementCount += entry.requirements.length;
		if (bundle.layoutValidation.ok) {
			conforming += 1;
		} else {
			findings.push({
				capability: entry.key,
				violations: bundle.layoutValidation.violations,
			});
		}
	}

	const meta: SeedMeta = {
		version: SEED_VERSION,
		revision: catalog.revision,
		counts: {
			domains: domainModel.domainCount,
			areas: domainModel.areaCount,
			features: domainModel.featureCount,
			documents: catalog.documents.length,
			capabilities: catalog.documents.filter(
				(document) => document.kind === "feature",
			).length,
			requirements: requirementCount,
		},
		layout: {
			checked: catalog.documents.length,
			conforming,
			violations: findings.length,
		},
	};

	const workspace: SeedWorkspace = {
		meta,
		catalog,
		navTree,
		domainModel,
		layouts: {
			index: registry?.index ?? null,
			layouts: registry ? [...registry.layouts.values()] : [],
			assignments,
			validations,
		},
		documents,
	};

	return { workspace, findings };
}

export function generateSeed(options: {
	openSpecRoot?: string;
	outDir?: string;
} = {}): GenerateSeedResult {
	const openSpecRoot = options.openSpecRoot ?? resolveOpenSpecRoot();
	const outDir = options.outDir ?? resolveSeedDir();
	const { workspace, findings } = buildSeedWorkspace(openSpecRoot);

	fs.mkdirSync(outDir, { recursive: true });
	writeJson(outDir, FILES.meta, workspace.meta);
	writeJson(outDir, FILES.catalog, workspace.catalog);
	writeJson(outDir, FILES.navTree, workspace.navTree);
	writeJson(outDir, FILES.domainModel, workspace.domainModel);
	writeJson(outDir, FILES.layouts, workspace.layouts);
	writeJson(outDir, FILES.documents, workspace.documents);

	return { workspace, outDir, findings };
}

let cachedSeed: { dir: string; workspace: SeedWorkspace | null } | null = null;

function readSeed(dir: string): SeedWorkspace | null {
	const metaPath = path.join(dir, FILES.meta);
	if (!fs.existsSync(metaPath)) return null;
	try {
		const read = <T>(file: string): T =>
			JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as T;
		return {
			meta: read<SeedMeta>(FILES.meta),
			catalog: read<OpenSpecCatalog>(FILES.catalog),
			navTree: read<OpenSpecNavNode>(FILES.navTree),
			domainModel: read<DomainAreaFeatureModel>(FILES.domainModel),
			layouts: read<SeedLayouts>(FILES.layouts),
			documents: read<Record<string, OpenSpecDocumentBundle>>(FILES.documents),
		};
	} catch {
		return null;
	}
}

/** Loads the baked seed workspace if present, memoized per directory. */
export function loadSeed(dir = resolveSeedDir()): SeedWorkspace | null {
	if (cachedSeed && cachedSeed.dir === dir) return cachedSeed.workspace;
	const workspace = readSeed(dir);
	cachedSeed = { dir, workspace };
	return workspace;
}

/** Test/CLI helper to drop the memoized seed. */
export function clearSeedCache(): void {
	cachedSeed = null;
}

import "@tanstack/react-start/server-only";

import {
	anchorFor,
	getOpenSpecEmbed as liveGetOpenSpecEmbed,
	loadOpenSpecCatalog as liveLoadOpenSpecCatalog,
	resolveOpenSpecEntry as liveResolveOpenSpecEntry,
	type OpenSpecCatalog,
	type OpenSpecCatalogEntry,
	type OpenSpecRequirement,
	resolveOpenSpecRoot,
} from "#/lib/spec/catalog";
import {
	getOpenSpecDocument as liveGetOpenSpecDocument,
	type OpenSpecDocumentBundle,
} from "#/lib/spec/document";
import { buildNavTree, type OpenSpecNavNode } from "#/lib/spec/domain-model";
import { loadSeed } from "#/lib/spec/static";

export type {
	OpenSpecCatalog,
	OpenSpecCatalogEntry,
	OpenSpecRequirement,
} from "#/lib/spec/catalog";
export { extractRequirements } from "#/lib/spec/catalog";
export type { OpenSpecDocumentBundle } from "#/lib/spec/document";
export type { OpenSpecNavNode } from "#/lib/spec/domain-model";

// resolveOpenSpecRoot is used internally and re-exported for callers/tests.
export { resolveOpenSpecRoot };

// The public reader prefers the baked static seed on the production default
// path (no explicit root). An explicit root always reads live from the
// filesystem, keeping dev workflows and the reader test suite deterministic.

export function loadOpenSpecCatalog(openSpecRoot?: string): OpenSpecCatalog {
	if (openSpecRoot === undefined) {
		const seed = loadSeed();
		if (seed) return seed.catalog;
	}
	return liveLoadOpenSpecCatalog(openSpecRoot ?? resolveOpenSpecRoot());
}

export function resolveOpenSpecEntry(
	identifier: string,
	openSpecRoot?: string,
): OpenSpecCatalogEntry | null {
	if (openSpecRoot === undefined) {
		const seed = loadSeed();
		if (seed) {
			return liveResolveOpenSpecEntry(
				identifier,
				resolveOpenSpecRoot(),
				seed.catalog,
			);
		}
	}
	return liveResolveOpenSpecEntry(
		identifier,
		openSpecRoot ?? resolveOpenSpecRoot(),
	);
}

export function getOpenSpecDocument(
	identifier: string,
	openSpecRoot?: string,
): OpenSpecDocumentBundle | null {
	if (openSpecRoot === undefined) {
		const seed = loadSeed();
		if (seed) {
			const entry = liveResolveOpenSpecEntry(
				identifier,
				resolveOpenSpecRoot(),
				seed.catalog,
			);
			if (!entry) return null;
			return seed.documents[entry.slug] ?? null;
		}
	}
	return liveGetOpenSpecDocument(
		identifier,
		openSpecRoot ?? resolveOpenSpecRoot(),
	);
}

export function getOpenSpecNavTree(openSpecRoot?: string): OpenSpecNavNode {
	if (openSpecRoot === undefined) {
		const seed = loadSeed();
		if (seed) return seed.navTree;
	}
	return buildNavTree(
		liveLoadOpenSpecCatalog(openSpecRoot ?? resolveOpenSpecRoot()),
	);
}

export function getOpenSpecEmbed(
	identifier: string,
	openSpecRoot?: string,
): {
	entry: OpenSpecCatalogEntry;
	requirement: OpenSpecRequirement | null;
	markdown: string;
} | null {
	if (openSpecRoot === undefined) {
		const seed = loadSeed();
		if (seed) {
			const [capabilityId, requirementId] = identifier.split("#", 2);
			const entry = liveResolveOpenSpecEntry(
				capabilityId,
				resolveOpenSpecRoot(),
				seed.catalog,
			);
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
			const markdown =
				requirement?.markdown ?? seed.documents[entry.slug]?.body ?? "";
			return { entry, requirement, markdown };
		}
	}
	return liveGetOpenSpecEmbed(identifier, openSpecRoot ?? resolveOpenSpecRoot());
}

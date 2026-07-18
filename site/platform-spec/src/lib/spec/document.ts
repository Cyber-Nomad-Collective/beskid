// Assembles the renderable document bundle for a capability. The bundle carries
// the native OpenSpec body plus the resolved enforceable layout and its
// validation result, so the reader and edit surfaces can show layout
// conformance. Pure module (no server-only / database imports).

import {
	loadOpenSpecCatalog,
	type OpenSpecCatalog,
	readEntryMarkdown,
	resolveOpenSpecEntry,
	resolveOpenSpecRoot,
} from "#/lib/spec/catalog";
import {
	type LayoutRegistry,
	type LayoutValidation,
	loadLayoutRegistry,
	type SpecLayout,
	validateEntryLayout,
} from "#/lib/spec/layouts";

export interface OpenSpecDocumentBundle {
	slug: string;
	href: string;
	pathClass: string;
	title: string;
	description: string | null;
	status: string | null;
	specLevel: string;
	/** Informative Book guides; they never alter this standard's authority. */
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
	/** Resolved enforceable layout for this document's spec level. */
	layout: SpecLayout | null;
	/** Result of validating the body against its enforceable layout. */
	layoutValidation: LayoutValidation;
	/** content.md is the only source; there is no coexisting content.json. */
	contentJson: null;
}

export interface DocumentContext {
	catalog?: OpenSpecCatalog;
	registry?: LayoutRegistry | null;
}

export function getOpenSpecDocument(
	identifier: string,
	openSpecRoot = resolveOpenSpecRoot(),
	context: DocumentContext = {},
): OpenSpecDocumentBundle | null {
	const catalog = context.catalog ?? loadOpenSpecCatalog(openSpecRoot);
	const entry = resolveOpenSpecEntry(identifier, openSpecRoot, catalog);
	if (!entry) return null;
	const registry =
		context.registry !== undefined
			? context.registry
			: loadLayoutRegistry(openSpecRoot);
	const body = readEntryMarkdown(entry, openSpecRoot);
	const { layout, validation } = validateEntryLayout(body, entry, registry);
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
			revision: catalog.revision,
		},
		body,
		layout,
		layoutValidation: validation,
		contentJson: null,
	};
}

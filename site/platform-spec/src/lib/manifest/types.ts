// Beskid Normative Manifest data model.
//
// The manifest is a chaptered, JSON-structured aggregation document that
// collects the most important normative facts about Beskid. Each chapter is a
// separate JSON document under content/manifest/. Entries reference OpenSpec
// capability identifiers (resolvable through openspec/catalog.json) and
// repository-relative source code file paths. The manifest never restates
// normative requirement text; it references the canonical capability instead.
//
// See openspec/specs/standard-normative-manifest/spec.md for the SHALL
// requirements this model satisfies.

/** References for a manifest entry. */
export interface ManifestReference {
	/** OpenSpec capability IDs (e.g. "language-meta--surface-syntax--lexical-and-syntax"). */
	capabilities: string[];
	/** Repository-relative source paths (e.g. "compiler/crates/beskid_isle/isle/expressions.isle"). */
	sources: string[];
}

/** A single catalogued fact inside a manifest section. */
export interface ManifestEntry {
	/** Stable entry identifier, unique within its chapter. */
	id: string;
	title: string;
	description: string;
	/** Concrete code examples (Beskid code or other). */
	examples?: string[];
	references: ManifestReference;
	/** Chapter-specific metadata (pestRules, upstream, version, etc.). */
	metadata?: Record<string, string | string[]>;
}

/** A titled group of entries within a chapter. */
export interface ManifestSection {
	id: string;
	title: string;
	description?: string;
	entries: ManifestEntry[];
}

/** A manifest chapter, authored as its own JSON document. */
export interface ManifestChapter {
	/** "introduction", "syntax-index", "corelib-runtime", "isle-lowering". */
	id: string;
	title: string;
	/** Declared order; chapters render in ascending order. */
	order: number;
	description?: string;
	sections: ManifestSection[];
}

/** The assembled Normative Manifest. */
export interface Manifest {
	title: string;
	version: string;
	/** Catalog revision the manifest reflects, or null when unavailable. */
	catalogRevision: string | null;
	chapters: ManifestChapter[];
}

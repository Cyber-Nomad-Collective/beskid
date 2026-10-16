## Context

OpenSpec is the sole normative authority and the platform-spec site renders it
directly from `openspec/specs` and `openspec/catalog.json`. Today a reader must
navigate capability by capability to assemble a picture of the language. An
ECMA-style Normative Manifest gives readers, implementers, and downstream
consumers a single chaptered document that aggregates the most important
normative facts and ties each to its platform spec capability and source code
file, viewable on the site and exportable as a normative document.

The manifest is an aggregation and reference layer, not a second normative
authority. It MUST NOT restate canonical requirement text; it references
capabilities and requirements by their stable identifiers and points at source
files.

## Decisions

### Chapter structure

The manifest is composed of separate JSON chapter documents, each declaring
its chapter identifier, title, and an ordered list of entries. The minimum
chapter set is:

- **Introduction** — documents the open-source projects and compiler
  dependencies used by Beskid (abfall, pest, cranelift/ISLE, salsa, fibers) and
  how each is used, with platform spec and source file references.
- **Syntax Index** — enumerates every surface syntax structure with a
  description, at least one example, a platform spec capability reference, and
  a source code file reference.
- **Corelib and Runtime** — aggregates corelib and runtime facts with
  capability and source references.
- **ISLE and Lowering** — aggregates the ISLE and lowering contracts with
  capability and source references.

Additional chapters MAY be added; the minimum set is mandatory.

### Reference model

Every chapter entry references one or more platform spec capability
identifiers resolvable through `openspec/catalog.json` and one or more
repository-relative source code file paths. The manifest never duplicates
normative requirement text; it links to the canonical capability and
requirement.

### Rendering and export

The platform-spec site renders the manifest as a single navigable page in
declared chapter order and provides a deterministic JSON export and a
self-contained rendered export, both reflecting the current catalog revision.

### Serving and navigation

The manifest is served at a stable public route and linked from reader
navigation so it is reachable without knowing its URL.

## Consequences

- The manifest adds an aggregation surface that must stay in sync with
  `openspec/catalog.json`; a stale manifest is detectable by comparing its
  revision to the catalog revision.
- The Syntax Index chapter creates an ongoing obligation to catalogue new
  syntax structures as they are added to the canonical grammar.
- The Introduction chapter creates an ongoing obligation to document new
  compiler dependencies as they are adopted.
- No normative authority moves to the manifest; canonical requirements remain
  in their capabilities, and the manifest only references them.

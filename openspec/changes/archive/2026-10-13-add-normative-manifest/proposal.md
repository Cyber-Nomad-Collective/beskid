## Why

The platform-spec site serves individual OpenSpec capability documents but
offers no aggregated, chaptered view of the most important normative facts
about Beskid. Readers, implementers, and downstream consumers cannot today
obtain a single structured document that ties syntax structures, corelib and
runtime facts, and ISLE/lowering contracts to their platform spec capabilities
and source code files, nor can they export such a document for offline or
normative reference.

## What Changes

- Add a new `standard-normative-manifest` capability defining the Beskid
  Normative Manifest: a chaptered, JSON-structured aggregation document.
- Require the manifest to be composed of separate JSON chapter documents
  covering at minimum Introduction, Syntax Index, Corelib and Runtime, and
  ISLE and Lowering.
- Require the manifest to be viewable as a rendered page and exportable as a
  complete normative document (JSON and rendered), with a deterministic JSON
  export per catalog revision.
- Require the Syntax Index chapter to enumerate every surface syntax structure
  with a description, at least one example, a platform spec capability
  reference, and a source code file reference.
- Require every chapter entry to reference platform spec capability IDs and
  repository-relative source code file paths.
- Require the Introduction chapter to document compiler dependencies (abfall,
  pest, cranelift/ISLE, salsa, fibers) and describe how each is used.
- Require the manifest to be served from the platform-spec site at a stable
  route and linked from reader navigation, reflecting the current catalog
  revision.

## Capabilities

### New Capabilities

- `standard-normative-manifest`: Defines the Normative Manifest aggregation
  document, its chapter structure, rendering, export, reference requirements,
  Introduction dependency documentation, and platform-spec serving contract.

### Modified Capabilities

None.

## Impact

- A future platform-spec implementation will add manifest chapter JSON
  documents, a rendered manifest page, JSON and rendered export endpoints, and
  a navigation link, all driven from `openspec/catalog.json`.
- Catalog generation will need to expose manifest chapter documents and their
  references so the rendered and exported manifest reflects the current
  revision.
- `openspec/catalog.json` will require regeneration once the new capability is
  accepted and the manifest chapter documents are introduced.
- Until the implementation lands and this change is accepted, the canonical
  OpenSpec standard and catalog remain unchanged; no manifest is served.

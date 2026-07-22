# Platform Spec Architecture Map and Navigation Design

## Goal

Replace the Platform Spec home page's catalog-count DAG with a factual, immutable, traversable architecture map of the beskid compiler and its direct boundaries. Rebuild the specification sidebar as a viewport-bound searchable tree whose matches are highlighted without allowing navigation content to determine document height.

## Scope

The architecture map covers the compiler and the systems that directly participate in compiling, running, specifying, or editing Beskid programs:

- OpenSpec authority and conformance evidence
- source, BSOL manifests, dependency resolution, pckg, corelib, and Compiler Mods
- parsing, expanded syntax, generation-bound Salsa facts, `TypedProgram`, and diagnostics
- `CodegenInput`, generated ISLE lowering, verified stock CLIF, `CodegenArtifact`, AOT, the ABI manifest, and runtime kits
- CLI, LSP, VS Code, and Tree-sitter boundaries

Tracker, Nexus, Auth, the website, delivery infrastructure, and observability are not expanded into detailed subsystems. Where needed, they appear only as boundary or evidence nodes.

The map is informative. OpenSpec requirements remain the normative authority, and the OpenSpec catalog remains the canonical source for public specification URLs.

## Current Problems

The home page currently converts the catalog into one root node and one count node per domain. It neither describes compiler architecture nor uses the domain URLs it computes. Every node points at the same repository directory, and an empty catalog fabricates fallback nodes.

The generic facts DAG permits node movement and presents compiler-independent fact cards. It cannot express architecture groups, lifecycle state, detailed evidence, or canonical specification links.

The sidebar eagerly renders approximately 250 links. Its scroll element is inside a `min-h-screen` flex chain without a viewport-bounded ancestor. Consequently, the tree grows the document to roughly 8,955 pixels instead of scrolling independently. It has no collapse, filtering, match highlighting, active-item reveal, or mobile replacement.

## Chosen Architecture

### Canonical architecture manifest

Create one checked-in TypeScript architecture manifest owned by Platform Spec. It is a conceptual model, not a projection of the site taxonomy and not generated from GitNexus. Stable concept IDs remain independent of crate names and URLs.

Each node contains:

- stable `id`, `label`, `description`, and conceptual `group`
- semantic `kind`
- lifecycle `state`: `current`, `transitional`, `retiring`, `target`, or `derived`
- `specKeys` resolved against the loader-provided OpenSpec catalog
- implementation `sourcePaths` used as evidence, not as public navigation targets
- optional tags and compact metadata for the detail panel

Each edge contains a stable ID, endpoints, a typed relationship, label, description, lifecycle state, and optional specification/evidence references.

The implementation validates that IDs are unique, edge endpoints exist, and every current public `specKey` resolves. Change-local target capabilities without catalog entries are labeled as target work and never receive invented public URLs.

### Conceptual groups and primary path

The main left-to-right build traversal is:

`Source and manifests -> workspace resolution -> expanded syntax -> Salsa facts -> TypedProgram -> CodegenInput -> generated ISLE -> stock CLIF -> verifier -> CodegenArtifact -> AOT -> runtime kit -> native artifact`

Supporting groups branch from that path:

- Authority and evidence: OpenSpec, generated catalog, conformance evidence
- Projects and packages: workspace resolution, pckg, corelib, Compiler Mods
- Frontend and semantics: parser, immutable syntax assembly, semantic facts, diagnostics
- Codegen and execution: lowering contract, ISLE, CLIF, verification, AOT, ABI/runtime kit
- Developer tooling: CLI, LSP, VS Code, Tree-sitter

Legacy typed-HIR preparation and Rust runtime/host compatibility remain visible as transitional or retiring nodes because they exist in the checkout. They are not shown as the production codegen path. JIT may appear only as a tooling/test boundary; the production path is AOT.

### Architecture-map interaction

Use a dedicated Platform Spec architecture-map component rather than extending the AST/facts component. It may reuse React Flow and dagre internally, but its public API and cards represent architecture concepts.

The graph is immutable:

- nodes are not draggable, connectable, deletable, or keyboard-movable
- no editing handles are rendered
- selection cannot mutate graph data

The graph remains traversable:

- pointer, touch, and keyboard users can pan, zoom, fit, select, and follow links
- selecting a node emphasizes its directly connected nodes and edges
- a persistent detail panel shows description, lifecycle, group, metadata, implementation evidence, and canonical specification links
- a small set of traversal presets can focus the build, IDE, and specification-to-code paths without duplicating graph data
- selection is represented accessibly and does not depend on color alone

Unknown or unresolved links are shown as unavailable evidence rather than silently redirected. Rendering an invalid manifest fails closed with a visible error state in development/tests.

## Searchable Specification Tree

The existing `buildNavTree` output remains the single navigation hierarchy. Search and disclosure are view concerns and do not create a second taxonomy.

The React navigation component owns:

- a search field with a clear action and result count
- collapsible domain and area branches
- automatic expansion of ancestors containing the active route
- automatic expansion of matching ancestors while a query is active
- case-insensitive matching over visible titles
- safe text highlighting with React fragments/`mark`, never HTML injection
- zero-results feedback
- keyboard navigation using standard tree semantics: arrows move and expand/collapse, Enter activates, Escape clears search
- active-item reveal after route changes

When search is empty, domain branches are available and the active path is expanded. When search is non-empty, unmatched branches and leaves are removed from the rendered tree while ancestor context is preserved. Clearing search restores the user's disclosure state.

At narrow widths, a top-bar button opens the same tree in an accessible modal sheet. Desktop and mobile consume one tree/search implementation.

## Height and Overflow Contract

The reader shell uses a dynamic-viewport-height flex frame:

- the outer reader is bounded to `100dvh`
- the top bar is non-growing
- the content row uses `min-height: 0` and clips outer overflow
- desktop navigation owns its vertical scroll
- the document main region owns its vertical scroll
- wide tables, preformatted blocks, and inline code scroll horizontally within the document instead of widening the viewport

This makes navigation length independent of article height and keeps the top bar stable.

## Data Flow

The home route loads the OpenSpec catalog and navigation tree as it does today. A pure resolver combines the checked-in architecture manifest with catalog entries, producing render-ready nodes with canonical internal links. The client component receives only serializable resolved data.

The navigation tree continues to come from `buildNavTree`. The search component filters that in-memory tree; it does not add a server request or a duplicate search index.

## Testing

Pure model tests verify:

- manifest IDs and edge endpoints
- catalog-key resolution and fail-closed handling
- AOT build-path ordering
- lifecycle labels for transitional/retiring nodes
- graph traversal adjacency and preset membership

Navigation tests verify:

- filtering preserves matching ancestors
- search text is highlighted safely
- clearing restores disclosure state
- active ancestors expand
- keyboard expansion and activation
- empty-result behavior

Layout-level tests or assertions verify the `100dvh` shell contract and independent overflow regions. Existing Platform Spec unit tests, type checking, formatting checks, production build, and client-bundle verification must pass.

## Documentation and Governance

Update the root glossary with the agreed meanings of “architecture map,” “immutable graph,” and “traversable graph.” Update the changelog under Unreleased. If the implementation exposes a new observable graph contract beyond this informative home surface, add normative OpenSpec requirements before shipping that contract.

## Out of Scope

- A 1:1 graph of all 34 compiler crates or all OpenSpec documents
- editable architecture diagrams
- live GitNexus-derived topology
- a detailed graph of Tracker, Nexus, Auth, website, deployment, or monitoring internals
- replacing document-level architecture assets or the raw JSON architecture slot unless required to share the new canonical renderer without duplication
- inventing public links for unpromoted OpenSpec changes


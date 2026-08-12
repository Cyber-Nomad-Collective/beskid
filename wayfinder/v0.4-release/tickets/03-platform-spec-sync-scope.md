## Status

Closed

## Assignee

Wayfinder agent (2026-08-12)

## Question

What exact platform-spec changes are needed for the v0.4.0 release — which new sections should be added to existing spec documents, what UX improvements should be made to the platform-spec site, and how should document rendering be enhanced?

The platform-spec site (`site/platform-spec`) reads OpenSpec directly and serves it at `spec.beskid-lang.org`. For 0.4:
- Determine which spec documents need new sections to reflect 0.4 compiler/runtime/corelib state
- Identify UX improvements for the site (navigation, search, rendering)
- Ensure all documents are properly rendered with the updated OpenSpec catalog

## Resolution

**Resolved 2026-08-12.** The existing OpenSpec corpus and reader already define the release-ready platform-spec scope; no new v0.4 normative sections are justified by the evidence.

- **Document scope:** retain the existing compiler, core-library, and runtime capability documents as the normative source. The reader identifies `openspec/specs/*/spec.md` as build-time authority, while `openspec/catalog.json` provides only stable IDs, revision metadata, and legacy aliases (`site/platform-spec/README.md:7-14`). Consequently, the v0.4 compiler/runtime/corelib state must be represented through the existing capability documents when its implementation contract changes—not through a release-summary spec page.
- **UX scope:** ship the already implemented searchable, keyboard-navigable hierarchical navigation rail. It searches the generated OpenSpec navigation tree and preserves/expands the active path (`site/platform-spec/src/components/reader/spec-nav-rail.tsx:166-223`); its tree items expose ARIA levels, expansion state, and selection (`site/platform-spec/src/components/reader/spec-nav-rail.tsx:117-140`). No additional navigation or search work is a release prerequisite.
- **Rendering scope:** use the existing hybrid reader: `StructuredDocumentView` renders Markdown, validates/enforces layout information, exposes related guides/ADRs/topics, and conditionally loads architecture graphs (`site/platform-spec/src/components/reader/structured-document-view.tsx:181-232`). The static build already regenerates and verifies seed artifacts before Vite production build (`site/platform-spec/package.json:9-22`). The release gate is therefore `pnpm --dir site/platform-spec run build`, following root `pnpm openspec:catalog && pnpm openspec:validate`.

This graduates the platform-spec fog into a bounded verification task: regenerate the catalog, validate OpenSpec, then run the platform-spec production build. It does not create undocumented content or fabricate 0.4-specific normative claims.

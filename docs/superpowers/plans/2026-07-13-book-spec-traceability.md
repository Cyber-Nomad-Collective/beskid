# Book and Standard Traceability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate reciprocal Book-to-OpenSpec traceability and make the highest-value technical Book pages complete, navigable guides.

**Architecture:** The catalog builder derives reciprocal Book references from existing informative-document metadata. A validator enforces canonical links for technical Book pages while allowing explicit narrative exceptions. The Book pilot adds focused explanations and standard links using existing Starlight components.

**Tech Stack:** Bun, TypeScript, Node test runner, Astro/Starlight, OpenSpec catalog.

## Global Constraints

- `openspec/specs` remains the sole normative authority.
- Book content is informative and must link to OpenSpec rather than restating requirements.
- Preserve legacy `/platform-spec/` links so the Book remark plugin canonicalizes them through `openspec/catalog.json`.
- Use `Aside` from `@astrojs/starlight/components` only for authority, prerequisite, pitfall, or next-step guidance.
- Do not modify existing unrelated working-tree changes.

---

### Task 1: Catalog-derived reciprocal Book traceability and validation

**Files:**
- Modify: `scripts/openspec/build-catalog.ts`
- Modify: `scripts/openspec/validate-standard.ts`
- Create: `scripts/openspec/validate-book-traceability.ts`
- Create: `scripts/openspec/validate-book-traceability.test.ts`
- Modify: `package.json`

- [ ] Write failing Node/Bun tests for a Book document with a canonical standard link, an uncovered technical Book document, and an explicit narrative exception.
- [ ] Run the focused tests and confirm they fail because the traceability validator is absent.
- [ ] Derive sorted reciprocal Book links in the catalog and implement the validator using catalog document metadata and the Book source.
- [ ] Run the focused tests, catalog rebuild, and OpenSpec validation.

### Task 2: Expand the technical Book pilot corpus

**Files:**
- Modify: `site/website/src/content/docs/book/13-reading-the-law/*.md`
- Modify: `site/website/src/content/docs/book/20-doc-comments-that-are-not-lies/*.md`
- Modify: `site/website/src/content/docs/book/21-ffi-and-forbidden-friendships/*.md`
- Modify: `site/website/src/content/docs/book/appendix-spec-map.md`

- [ ] Add focused explanatory sections, canonical standard links, hub links, and existing-style `Aside` callouts to the thin technical pages.
- [ ] Use typed `spec` directives only where the existing embeds add useful capability status/context.
- [ ] Run documentation-link tests and the website build.

### Task 3: Integrate and document the change

**Files:**
- Modify: `CHANGELOG.md`

- [ ] Review that catalog links are generated and Book prose remains informative.
- [ ] Add a concise Unreleased changelog entry.
- [ ] Run `bun run openspec:catalog`, `bun run openspec:validate`, `bun --cwd site/website run test:docs-links`, and `bun --cwd site/website run build`.

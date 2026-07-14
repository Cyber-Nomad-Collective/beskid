---
title: "How to propose a change"
description: A contributor path from design gap to OpenSpec change, implementation, and validation.
tableOfContents: true
---

You found a bug or a missing feature. Excellent. Here is how to avoid becoming another "we'll document it later" statistic.

## 1. Classify ownership

Use [language law vs implementation](/book/12-the-normative-bible/language-law-vs-implementation/):

- User-visible semantics → extend **language-meta** first.
- CLI/manifest/LSP → **tooling** with links back.
- Runtime/GC/fibers → **execution** + language-meta cross-links.
- `corelib` API → **core-library**.

## 2. Write or update spec

- Find the capability in `openspec/catalog.json` and edit it through an `openspec/changes/<change>/` delta.
- Put normative behavior in `### Requirement:` sections with at least one `#### Scenario:`.
- Keep tutorials and rationale in the Book; link them with typed `spec` and `book` embeds.
- Run `openspec validate --all --strict` from the repository root after edits.

Templates: [Feature hub + article bundle](/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/), [Frontmatter template](/platform-spec/community/spec-maintenance/domain-area-feature-article-frontmatter-template/).

## 3. Implement with anchors

Update `compiler/` (or corelib/tooling) and refresh [crate-to-spec anchors](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/) when crate boundaries move.

## 4. Verify

| Check | Command / location |
| --- | --- |
| OpenSpec structure and deltas | `openspec validate --all --strict` |
| Compiler behavior | `cargo test` in `compiler/`, `beskid_tests` fixtures |
| Repository conformance gate | `bash scripts/ci/openspec-gate.sh` |

## 5. Informative follow-up

Update book chapters or [reference](/book/reference/) when tutorials should reflect the new world—**after** normative text lands.

## Community hub

[Spec maintenance area](/platform-spec/community/spec-maintenance/)

## Next chapter

[13. Reading the law without going blind](/book/13-reading-the-law/)

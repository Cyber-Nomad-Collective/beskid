---
title: Documentation comments
description: Structured comments attach human-readable contracts to
  declarations. Tooling must preserve them through formatting and refactors
  without changing semantics.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Normative specification

### Scope

Defines how **documentation comments** attach to declarations and how tools **must** expose them. Lexical rules for `///` are in [Lexical and syntax](/platform-spec/language-meta/surface-syntax/lexical-and-syntax/).

### Static rules

- A **documentation run** (`DocRun`) is one or more consecutive lines starting with `///` where the third `/` is **not** followed by another `/`.
- Documentation **must** attach only to items parsed through `ItemWithDocs` or parameter/method/variant doc wrappers.
- Leading documentation on an item **must** appear immediately before the item’s inner declaration (after attributes, if any).

### Dynamic semantics (tooling)

- The compiler **must** preserve doc text in semantic snapshots for LSP hover and generated API docs.
- Doc text is **informative** for type checking; it **must not** alter name lookup or contract satisfaction.
- Tools **should** render `DocRun` as Markdown-compatible plain text.

### Diagnostics

Malformed doc attachment **should** warn once the doc pipeline is strict; v0.1 **may** ignore orphan `///` outside wrappers.

### Conformance

Formatter **must not** reorder `///` runs across distinct items. LSP **must** return stored doc strings for resolved symbols.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->

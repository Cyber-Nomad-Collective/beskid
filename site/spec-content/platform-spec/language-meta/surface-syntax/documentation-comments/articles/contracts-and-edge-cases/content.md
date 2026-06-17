---
title: Documentation comments - Contracts and edge cases
description: Normative contracts, edge cases, hard requirements, and invariants for Documentation comments.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-15
---

## Hard requirements

A documentation run (`DocRun`) is one or more consecutive lines starting with `///` where the third `/` is **not** followed by another `/`. Documentation **must** attach only to items parsed through `ItemWithDocs` or parameter/method/variant doc wrappers.

Leading documentation on an item **must** appear immediately before the item's inner declaration (after attributes, if any).

## Edge cases

### `////` and longer

Four or more consecutive slashes (`////`, `/////`, etc.) are **never** documentation comments. The third `/` must not be followed by another `/` for the line to qualify as a doc run.

### Orphan doc runs

`///` lines that appear outside of `ItemWithDocs` or doc wrapper productions are orphans. Tools **should** warn on orphan doc runs once the doc pipeline is strict; v0.1 **may** silently ignore them.

### Doc on non-doc items

`///` applied to items that are not wrapped in `ItemWithDocs` (e.g., standalone expressions, inline blocks) is ill-formed. The parser **must** reject these or leave them as parse orphans.

### Attachments between attributes

Doc runs between attributes and a declaration belong to the declaration, not to the last attribute. Attribute position is independent of doc position.

## Invariants

1. Doc text is **informative** for type checking; it **must not** alter name lookup or contract satisfaction.
2. Tools **should** render `DocRun` as Markdown-compatible plain text.
3. The compiler **must** preserve doc text in semantic snapshots for LSP hover and generated API docs.
4. Doc comments cannot introduce new MUST rules (D-LM-DOC-002).

## Contract guarantees

Implementations must satisfy the contracts defined in the parent hub and in the four decisions D-LM-DOC-001 through D-LM-DOC-004. Violations must be surfaced through the diagnostic system.

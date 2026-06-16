---
title: Primary contract for Analysis, query, and diagnostics facades
description: This feature hub defines the normative contract for
  **`Beskid.Compiler.Query`** and **`Beskid.Compiler.Diagnostics`** (a
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-MODS-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **`Beskid.Compiler.Query`** and **`Beskid.Compiler.Diagnostics`** (and related analysis facades) and links detailed articles.

## Decision

The reference compiler **must** implement Analysis, query, and diagnostics facades as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/`
- `compiler/crates/beskid_analysis/src/resolve/`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`

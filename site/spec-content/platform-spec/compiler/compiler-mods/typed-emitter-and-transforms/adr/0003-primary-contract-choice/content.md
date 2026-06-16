---
title: Primary contract for Typed emitter and transforms
description: This feature hub defines the normative contract for
  **`Beskid.Compiler.Emit`** (typed emitter and transforms) and links
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-MODS-0018
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **`Beskid.Compiler.Emit`** (typed emitter and transforms) and links detailed articles.

## Decision

The reference compiler **must** implement Typed emitter and transforms as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/syntax/items/`
- `compiler/crates/beskid_codegen/`

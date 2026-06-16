---
title: Parser and AST contracts
description: Front-end contracts for grammar parsing, syntax item construction,
  and formatter AST consumption.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

## What this feature governs

This feature defines how raw source text becomes the typed syntax model used by name resolution, semantic analysis, and formatting. The grammar lives in `beskid_analysis/src/beskid.pest`, while syntax item and type nodes under `beskid_analysis/src/syntax` form the canonical AST contract.

## Core guarantees

1. Parser entry points convert `pest` failures into diagnostics that preserve source ranges and actionable messages.
2. Syntax node builders in `syntax/items` and `syntax/types` are the single source of truth for declaration and type shapes.
3. Formatter paths consume these syntax nodes and do not maintain an independent parse model.
4. Parser updates must keep resolver and diagnostics consumers source-compatible or include coordinated downstream updates.

## Implementation anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/parsing`
- `compiler/crates/beskid_analysis/src/syntax/items`
- `compiler/crates/beskid_analysis/src/syntax/types`
- `compiler/crates/beskid_analysis/src/resolve`
- `compiler/crates/beskid_analysis/src/analysis`
## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0010` … `D-COMP-FRONT-0012`); use the reader **ADRs** tab for expandable detail.

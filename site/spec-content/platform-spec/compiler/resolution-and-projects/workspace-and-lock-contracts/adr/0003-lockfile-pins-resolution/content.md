---
title: Lockfile pins drive resolution
description: Floating registry versions broke reproducible compiles.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-PROJ-0012
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Floating registry versions broke reproducible compiles.

## Decision

Workspace resolution **must** honor lockfile pins from `beskid_analysis::resolve` before applying CLI overrides.

## Consequences

Lock update commands are explicit; silent refresh is forbidden in CI modes.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`.

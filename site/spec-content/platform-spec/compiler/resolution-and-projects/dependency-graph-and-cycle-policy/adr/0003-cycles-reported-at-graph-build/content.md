---
title: Dependency cycles reported at graph build
description: Silent cycle handling broke workspace diagnostics parity.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-PROJ-0003
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Silent cycle handling broke workspace diagnostics parity.

## Decision

Directed cycles **must** be reported during graph build; `Mod` cycles **must** include mod id in the diagnostic path.

## Consequences

Policy knobs (`error`, `warn`, permissive) select abort vs continue; default remains fail-closed for release builds.

## Verification anchors

- `beskid_analysis::projects::graph`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`.

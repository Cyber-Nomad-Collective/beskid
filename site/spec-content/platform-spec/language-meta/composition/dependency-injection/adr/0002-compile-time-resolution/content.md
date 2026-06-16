---
title: Composition graph resolved at compile time
description: Backends do not perform runtime service lookup for app DI.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0002
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Runtime DI containers hide wiring and conflict with the project's explicit composition goals (distinct from Rust pipeline IoC in D-INC-0002).

## Decision

The reference compiler **must** fully resolve the app composition graph at compile time. Backends **must not** perform runtime service lookup for **`host`** / **`registry`** / **`scope`** wiring.

## Consequences

Lowering emits ctor wiring and scope enter/leave; execution hosts activate frozen graphs only.

## Verification anchors

`compiler/crates/beskid_analysis` (planned `composition` module); `compiler/crates/beskid_codegen`; [Flow and algorithm](/platform-spec/language-meta/composition/dependency-injection/flow-and-algorithm/).

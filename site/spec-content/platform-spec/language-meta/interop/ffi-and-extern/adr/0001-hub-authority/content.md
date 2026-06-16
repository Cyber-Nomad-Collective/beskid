---
title: Feature hub owns normative contract
description: Author-facing extern import rules live on this hub.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-FFI-0001
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

v0.3 interop split author syntax from execution lowering; articles must not fork MUST tables.

## Decision

This feature hub **must** own normative MUST/SHOULD contract text for foreign **import**. Sibling articles **must not** redefine hub requirements.

## Consequences

Execution and tooling specs link here for `Extern` placement and attribute shape.

## Verification anchors

/platform-spec/language-meta/interop/ffi-and-extern/; `compiler/crates/beskid_analysis` contract validation.

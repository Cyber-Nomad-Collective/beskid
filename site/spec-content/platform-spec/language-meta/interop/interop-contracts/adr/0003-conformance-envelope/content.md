---
title: Conformance and versioning envelope
description: Forward compatibility rules for hosts claiming Interop.Contracts.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-IC-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Hosts and compilers need a shared compatibility story at boundaries.

## Decision

This feature **must** specify symbol identity, type-shape classes, call-shape classes, ownership obligations, error/unwind semantics, and a **conformance envelope** (versioning and forward compatibility) for compatibility claims.

## Consequences

ABI contract tests and `BESKID_RUNTIME_ABI_VERSION` align to the envelope.

## Verification anchors

`compiler/crates/beskid_tests/src/abi/contracts.rs`; [conformance and versioning](/platform-spec/language-meta/interop/interop-contracts/conformance-and-versioning/).

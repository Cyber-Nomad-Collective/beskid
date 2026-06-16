---
title: Feature hub owns normative contract
description: Abstract boundary vocabulary authority.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-IC-0001
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

C and Rust profiles previously duplicated primitive definitions.

## Decision

This feature hub **must** own the language-agnostic **Interop.Contracts** vocabulary. Profile features **must** bind these primitives, not redefine them.

## Consequences

Articles under C/Rust ABI cite ownership, call shapes, and conformance from here.

## Verification anchors

/platform-spec/language-meta/interop/interop-contracts/

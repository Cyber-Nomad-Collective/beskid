---
title: Feature hub owns normative contract
description: C/System V binding rules defer to this hub.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-CABI-0001
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Interop.Contracts primitives need a single C profile authority for tier-1 hosts.

## Decision

This feature hub **must** own normative MUST/SHOULD for **C-compatible** foreign libraries. Sibling articles add detail without redefining hub MUST tables.

## Consequences

Cranelift lowering and foreign library import tooling align to this profile.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/

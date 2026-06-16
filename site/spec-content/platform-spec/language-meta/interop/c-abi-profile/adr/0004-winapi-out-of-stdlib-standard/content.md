---
title: WinAPI outside stdlib Standard
description: Windows user-extern linking not tier-1 Standard in corelib.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-CABI-0004
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

WinAPI/stdcall surfaces belong in platform packages with distinct conformance tiers.

## Decision

**WinAPI / stdcall** as a **stdlib** concern is **out of scope** for tier-1 **Standard** conformance; platform packages may document **Proposed** mappings separately.

## Consequences

[Platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/) records host-specific tiers.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/

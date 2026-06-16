---
title: Feature hub owns normative contract
description: Sibling articles defer to this hub for MUST/SHOULD authority.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0001
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Composition articles and compiler notes mixed informal wiring guidance with normative host syntax.

## Decision

This feature hub **must** own normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

## Consequences

FAQ locked decisions migrate to ADRs; articles retain examples and troubleshooting tables only.

## Verification anchors

/platform-spec/language-meta/composition/dependency-injection/; `verify:trudoc`.

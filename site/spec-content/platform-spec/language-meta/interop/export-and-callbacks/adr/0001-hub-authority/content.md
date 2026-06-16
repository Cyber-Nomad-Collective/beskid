---
title: Feature hub owns normative contract
description: Beskid-to-foreign export authority.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-EXPORT-0001
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Export/callback rules were scattered between runtime and language-meta drafts.

## Decision

This feature hub **must** own normative MUST/SHOULD for Beskid **export** and **callback registration** (user interop).

## Consequences

Distinct from runtime builtin exports on Rust ABI profile.

## Verification anchors

/platform-spec/language-meta/interop/export-and-callbacks/

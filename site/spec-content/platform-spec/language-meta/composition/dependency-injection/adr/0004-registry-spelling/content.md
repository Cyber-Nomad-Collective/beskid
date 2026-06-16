---
title: registry spelling locked
description: Global registrations use registry block name registry.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0004
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Early drafts considered alternate container keywords.

## Decision

The global registration block **must** be spelled **`registry`** (locked for v0.2+).

## Consequences

Parser, diagnostics, and docs use one keyword; no alias `container` in Standard conformance.

## Verification anchors

Grammar and semantic snapshots when composition lands.

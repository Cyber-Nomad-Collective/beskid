---
title: Single normative platform-spec tree
description: Only /platform-spec/ is normative; legacy execution/corelib/book
  paths are non-normative unless bridged.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-VERS-0004
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Parallel **non-normative** legacy trees (`/execution/`, `/corelib/`, Starlight guides) were cited as law alongside platform-spec.

## Decision

The [Platform specification](/platform-spec/) domain is the **one** normative documentation tree for language and platform contracts. Legacy trees are **non-normative** only: informative [`/execution/`](/execution/) and [`/corelib/`](/corelib/) Starlight paths, plus book and guides, unless explicitly bridged per [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/).

## Consequences

Public site exposes **Platform specification** and **Book** only; bridge pages link canonical destinations.

## Verification anchors

[Legacy spec mapping](/platform-spec/legacy-spec-mapping/); `PSC005` stale legacy bridge checks.

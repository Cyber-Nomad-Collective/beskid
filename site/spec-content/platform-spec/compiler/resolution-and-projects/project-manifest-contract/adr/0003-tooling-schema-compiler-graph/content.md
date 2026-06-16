---
title: Tooling owns schema; compiler owns graph
description: Manifest key tables were duplicated between tooling and compiler specs.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-PROJ-0006
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Manifest key tables were duplicated between tooling and compiler specs.

## Decision

Author-facing `Project.proj` key tables live only under tooling; this compiler feature documents resolution graph behavior and defers schema prose via `relatedTopics`.

## Consequences

Compiler changes manifest parsing only when graph or diagnostic bands change; tooling spec leads schema edits.

## Verification anchors

- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs`
- `tooling project-manifest-contract hub.`

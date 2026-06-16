---
title: Migration mapping page required sections
description: Mapping pages include scope, canonical destinations grouped by
  domain, and retirement notes.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-BRIDGE-0003
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Ad-hoc mapping tables mixed partial coverage with implied normative scope.

## Decision

Migration mapping pages **must** include: (1) a one-sentence non-normative notice; (2) a **Canonical destinations** section linking target feature hubs; (3) a **Mapping scope** section stating coverage and exclusions; (4) a maintenance note for retirement timing. Multi-domain mappings **must** group links by destination domain/area.

## Consequences

Bridge pages become checklist-complete before merge; retirement removes the bridge when canonical nav suffices.

## Verification anchors

[Legacy spec mapping](/platform-spec/legacy-spec-mapping/) structure review in PR template.

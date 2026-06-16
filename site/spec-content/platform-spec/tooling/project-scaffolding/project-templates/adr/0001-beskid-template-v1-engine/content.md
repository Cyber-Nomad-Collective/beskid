---
title: Beskid-native template engine schema
description: Use beskid.template.v1 only
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-TOOL-SCAFF-0001
adrStatus: Accepted
adrDate: 2026-05-21
lastReviewed: 2026-05-22
---

## Context

Foreign template engines would split validation and documentation across ecosystems.

## Decision

The platform **must** use **`beskid.template.v1`** only. Foreign engine schemas are forbidden in spec, CLI, and pckg.

## Consequences

Single parser and validator in tooling; template docs stay in-repo.

## Verification anchors

CI grep excluding foreign schema identifiers under `compiler/` and platform-spec tooling tree.

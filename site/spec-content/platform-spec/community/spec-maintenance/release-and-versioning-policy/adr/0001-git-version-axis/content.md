---
title: Git is the canonical specification version axis
description: Contract truth is the platform-spec tree at a commit; no parallel
  normative URL version hierarchy.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-VERS-0001
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Version-segmented doc sites diverged from the implementation on `main`. Inception record **D-INC-0007** states the platform-wide choice.

## Decision

The platform specification under [/platform-spec/](/platform-spec/) is versioned by **Git** (typically `main`). Readers and tooling **must** treat the spec at a given commit as the contract for that commit; there is **no** parallel normative URL hierarchy such as `/platform-spec/v0.2/...`.

## Consequences

Site deploy and release policy track `main`; `lastReviewed` records alignment dates.

## Verification anchors

[D-INC-0007](/platform-spec/community/project-inception/adr/0007-git-main-version-axis/).

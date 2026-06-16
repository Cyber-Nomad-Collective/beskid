---
title: Feature hub authority
description: This feature hub owns normative MUST/SHOULD contract text for
  Extern import extraction contract.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-IR-0004
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Sibling articles under this feature previously restated requirements in inconsistent forms.

## Decision

This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

## Consequences

Contract changes start on the hub or in linked ADRs, then propagate to articles and implementation anchors.

## Verification anchors

- `site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/index.mdx`
- `article bundle under the same feature directory.`

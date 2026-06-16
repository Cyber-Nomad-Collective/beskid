---
title: Canonical platform-spec frontmatter templates
description: Domain, area, feature, and article YAML shapes aligned with trudoc
  Zod and CI validators.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-META-0001
adrStatus: Accepted
adrDate: 2026-05-09
lastReviewed: 2026-05-22
---

## Context

Hand-written frontmatter drifted from `platformSpecNodeSchema` and layout scanners, causing PR failures late in CI.

## Decision

New nodes **must** use the canonical templates on the parent feature hub: `specLevel` discriminates **domain**, **area**, **feature**, or **article**; `status` is required on **feature** and **article** only; `owner` and `submitter` **must** include non-empty `name` and valid `email`; every domain/area/feature hub directory **must** ship `layout.json`.

## Consequences

`verify:platform-spec-frontmatter` blocks invalid shapes before build.

## Verification anchors

`packages/trudoc/src/schema/content.ts`; `packages/trudoc/src/verify/platform-spec-frontmatter.ts`.

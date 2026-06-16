---
title: Last reviewed policy
description: Policy for `lastReviewed` metadata and drift detection in
  high-change feature pages.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

## Normative platform contract

1. High-churn feature pages should set `lastReviewed` in ISO date format.
2. If implementation anchors change materially, `lastReviewed` should be updated in the same change set.
3. Optional verification scripts may warn when pages with implementation anchors omit `lastReviewed`.

## Decisions

No open decisions. Closed maintenance ADR under **`adr/`** — `D-COMM-REV-0001` (reader **ADRs** tab).

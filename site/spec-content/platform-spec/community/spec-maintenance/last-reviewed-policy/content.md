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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-REV-0001`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->

---
title: Three-tier conformance evidence
description: Release arguments lacked traceable proof layers.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-CONF-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Release arguments lacked traceable proof layers.

## Decision

Standard conformance claims require analysis fixtures, doc tests, and e2e runtime evidence—mapped in hub verification articles.

## Consequences

A single test kind cannot satisfy Standard maturity alone.

## Verification anchors

- `compiler/crates/beskid_tests/`
- `compiler/crates/beskid_e2e_tests/`.

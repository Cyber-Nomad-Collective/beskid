---
title: Primary contract for Diagnostics parity (CLI and LSP)
description: This feature hub documents where diagnostics come from in CLI and
  LSP, and what differences are expected versus consider
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0012
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub documents where diagnostics come from in CLI and LSP, and what differences are expected versus considered regressions.

## Decision

The reference compiler **must** implement Diagnostics parity (CLI and LSP) as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`

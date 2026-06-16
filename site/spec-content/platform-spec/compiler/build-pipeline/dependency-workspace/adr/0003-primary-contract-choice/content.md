---
title: Primary contract for Dependency workspace and lockfile
description: This feature hub specifies how manifests become prepared dependency
  workspaces and how `Project.lock` is synchronized un
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0009
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub specifies how manifests become prepared dependency workspaces and how `Project.lock` is synchronized under `--locked` and `--frozen`.

## Decision

The reference compiler **must** implement Dependency workspace and lockfile as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`

---
title: Crate-to-spec anchor map is canonical index
description: Canonical index from compiler crates to platform-spec features.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-MAP-0003
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Crate references were scattered across hubs without a single ownership surface.

## Decision

This feature hub is the canonical map from `compiler/crates/*` to platform-spec features; other pages link here instead of duplicating tables.

## Consequences

New crates require anchor rows before Standard promotion of dependent features.

## Verification anchors

- Implementation-map articles and `compiler/Cargo.toml` workspace layout.

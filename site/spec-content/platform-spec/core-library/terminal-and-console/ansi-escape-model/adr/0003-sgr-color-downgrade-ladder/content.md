---
title: SGR color downgrade ladder
description: Truecolor sequences downgrade via EffectiveColorModel.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Terminals differ in color depth; emitting unsupported `38;2` breaks dumb hosts.

## Decision

| Rule | Detail |
| --- | --- |
| Ladder | truecolor → 256 → basic per `EffectiveColorModel` |
| Policy | Callers do not pick per-sequence models manually |

## Consequences

SGR builders consult capability probes before emitting RGB CSI.

## Verification anchors

`AnsiSgrGoldenTests.bd`; `CapabilitiesTests.bd`.

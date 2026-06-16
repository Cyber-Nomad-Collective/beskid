---
title: COLORTERM upgrades to TrueColor
description: COLORTERM presence selects TrueColor when color allowed.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0021
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Modern terminals advertise truecolor via COLORTERM without breaking NO_COLOR.

## Decision

| Rule | Detail |
| --- | --- |
| Probe | `COLORTERM` set → `TrueColor` when color not stripped |
| `FORCE_COLOR` | May enable emission on non-TTY stdout |

## Consequences

EffectiveColorModel reflects env probes before SGR downgrade (see D-CORE-TERM-0003).

## Verification anchors

`CapabilitiesTests.bd`.

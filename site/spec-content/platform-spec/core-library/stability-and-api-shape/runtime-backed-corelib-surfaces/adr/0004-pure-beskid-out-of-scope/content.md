---
title: Pure Beskid modules out of scope
description: Foundation-style modules without builtins follow normal lowering.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-STAB-0004
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Not every corelib module is runtime-backed.

## Decision

| Rule | Detail |
| --- | --- |
| In scope | Builtin/syscall facades documented here |
| Out of scope | Pure Beskid `foundation` modules |

## Consequences

This feature does not duplicate language-meta semantics for pure libraries.

## Verification anchors

foundation package compile tests.

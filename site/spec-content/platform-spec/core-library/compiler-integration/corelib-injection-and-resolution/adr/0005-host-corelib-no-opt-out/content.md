---
title: Host projects cannot opt out of corelib
description: Parser rejects noCorelib and useCorelib false.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0005
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Every host compilation must see the standard library graph.

## Decision

| Rule | Detail |
| --- | --- |
| Forbidden keys | `noCorelib`, `useCorelib: false` rejected at parse |
| Templates | Scaffolds **must not** emit opt-out keys |

## Consequences

Implicit injection in `resolve_dependencies` always attaches corelib.

## Verification anchors

`projects/parser.rs`; template manifest tests.

---
title: Write panics; read returns Result
description: Syscall write failures panic; reads surface Result.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0011
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

v1 write helpers are infallible at the type level; read paths need explicit error handling.

## Decision

| Rule | Detail |
| --- | --- |
| Write | `Write` / `WriteLine` **must** panic on `WriteWith` failure |
| Read | `Read` / `ReadLine` return `` `Result<string, SyscallError>` `` |

## Consequences

Diagnostics for write failures use fixed panic strings; callers cannot catch write errors in Beskid v1.

## Verification anchors

Corelib stream tests; syscall integration in `beskid_runtime`.

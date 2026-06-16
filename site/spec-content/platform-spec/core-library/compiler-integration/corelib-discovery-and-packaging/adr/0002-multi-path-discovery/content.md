---
title: Multi-path corelib discovery
description: Env, repo walk, and bundled CLI materialize the same tree.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0002
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Developers run from superrepo, installed CLI, or CI without divergent roots.

## Decision

| Rule | Detail |
| --- | --- |
| `BESKID_CORELIB_ROOT` | Points at root containing `beskid_corelib/Project.proj` |
| Walk | Ancestor search for `compiler/corelib/beskid_corelib` |
| Bundle | `beskid_cli` `ensure_corelib_ready` materializes embedded tree |

## Consequences

Missing roots fail fast with resolver diagnostics.

## Verification anchors

`corelib_runtime.rs`; `resolver.rs` tests.

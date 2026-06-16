---
title: CLI and LSP resolver parity
description: CLI and LSP share corelib discovery and graph options.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0008
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

IDE analysis must match CLI compilation attachment.

## Decision

| Rule | Detail |
| --- | --- |
| CLI | `ensure_corelib_ready` before commands |
| LSP | `CompilationContext::try_for_analysis_path_with_graph_options` |

## Consequences

Diagnostic drift between CLI and LSP indicates a resolver bug.

## Verification anchors

LSP workspace tests; `corelib/compile.rs`.

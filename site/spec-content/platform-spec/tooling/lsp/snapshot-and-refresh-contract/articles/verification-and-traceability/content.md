---
title: Verification and traceability
description: Tests and traceability for the LSP snapshot and refresh contract.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Test anchors

| Concern | Location |
| --- | --- |
| Resolver + graph | `compiler/crates/beskid_tests/src/analysis/resolve.rs` |
| Analysis services | `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs` |
| Document analysis build | `beskid_analysis::services` unit/integration tests |

## Traceability

| Requirement | Evidence |
| --- | --- |
| `ANALYSIS_CACHE_VERSION` bump forces rebuild | Lifecycle tests or manual protocol check when version changes |
| Skip directories during scan | `should_skip_dir_for_scan` unit coverage in `workspace_scan.rs` |
| Invalidation on manifest change | `backend.rs` configuration handler paths |
| Diagnostic debounce | Revision counter logic in `schedule_publish_diagnostics` |

## Manual verification

1. Open multi-file project; edit one file; confirm diagnostics update after pause.
2. Change `Project.proj`; confirm all open files refresh.
3. Compare `beskid analyze` output to LSP Problems for same snapshot generation.

## Spec updates

Changes to cache keys, skip lists, or debounce intervals **must** update this article and the VS Code extension status contract when user-visible phases change.

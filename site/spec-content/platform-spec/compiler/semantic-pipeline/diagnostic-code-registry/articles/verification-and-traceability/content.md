---
title: Verification and traceability
description: Checks that keep diagnostic code docs and source synchronized.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Traceability anchors:

- Source of truth: `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- Rule emitters: `compiler/crates/beskid_analysis/src/analysis/rules`
- Verification script: `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`

Suggested verification path:

1. Run semantic tests after registry changes.
2. Run diagnostic spec synchronization (`packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs` via the website/trudoc verify scripts).
3. Validate at least one CLI and one LSP diagnostics scenario to confirm code identity parity.

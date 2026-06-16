---
title: Verification and traceability
description: How semantic rule behavior is validated and traced to source modules.
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

- Rule definitions: `compiler/crates/beskid_analysis/src/analysis/rules`
- Staged definitions: `.../analysis/rules/staged/definitions.rs`
- Diagnostic catalog: `.../analysis/diagnostic_kinds.rs`
- Surface adapters: `.../beskid_analysis/src/services/`, `.../beskid_lsp/src/diagnostics.rs`

Verification checklist:

1. Run semantic diagnostics tests and fixture suites after rule edits.
2. Confirm new issues are assigned stable diagnostic codes.
3. Verify CLI and LSP report equivalent issue identities and spans.

---
title: Diagnostics parity (CLI and LSP) - Verification and traceability
description: Source anchors and tests used to prevent diagnostic drift between
  compiler surfaces.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Implementation anchors:

- `compiler/crates/beskid_cli/src/frontend.rs`
- `compiler/crates/beskid_codegen/src/services.rs`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
- `compiler/crates/beskid_analysis/src/services/`

Verification strategy should compare fixture diagnostics across CLI and LSP cold/warm paths.

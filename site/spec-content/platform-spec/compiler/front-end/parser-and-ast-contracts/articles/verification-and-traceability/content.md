---
title: Verification and traceability
description: How to verify parser behavior and trace docs back to source.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Traceability map for this feature:

- **Grammar source:** `compiler/crates/beskid_analysis/src/beskid.pest`
- **Syntax node construction:** `compiler/crates/beskid_analysis/src/syntax/items`, `.../src/syntax/types`
- **Handoff consumers:** `.../src/resolve`, `.../src/analysis`

Recommended verification routine:

1. Run targeted parser and analysis tests after grammar or syntax edits.
2. Confirm diagnostics include expected code/category and stable source location mapping.
3. Run formatter checks when AST shape changes affect output ordering or spacing.

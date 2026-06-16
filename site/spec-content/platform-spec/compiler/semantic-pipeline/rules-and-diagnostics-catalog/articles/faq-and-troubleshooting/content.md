---
title: FAQ and troubleshooting
description: Common semantic-pipeline debugging questions and practical checks.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

### Why do semantic tests fail after parser changes?

Rules often assume specific syntax node shapes. Re-check parser output and resolver binding before changing rule logic.

### Where should a new diagnostic kind be added?

Add it in `analysis/diagnostic_kinds.rs`, then wire rule emission to the new kind. Do not introduce one-off string codes inside rule modules.

### Why do CLI and LSP messages look different?

Presentation may differ, but code identity and source spans must match. Validate through shared diagnostics tests and adapter checks.

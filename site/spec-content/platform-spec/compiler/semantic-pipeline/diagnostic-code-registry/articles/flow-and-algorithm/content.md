---
title: Flow and algorithm
description: Lifecycle of a semantic diagnostic code from definition to surfaced output.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Code lifecycle algorithm:

1. Define or reuse an issue kind in `diagnostic_kinds.rs`.
2. Emit that kind from a semantic rule in `analysis/rules`.
3. Convert issue kind to stable code/category payload.
4. Surface payload through services to CLI and LSP.
5. Validate docs and source sync with diagnostics verification scripts.

The code identity must survive every handoff unchanged, even when message templates differ between clients.

---
title: Diagnostics parity (CLI and LSP) - Design model
description: Provenance model for parse and semantic diagnostics across compiler surfaces.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Parity is defined at semantic meaning, not identical text formatting. CLI and LSP **must** use the same `ProgramAssembly` discovery mode policy (closure for build/run; workspace scan for IDE project diagnostics when a compile plan exists).

- CLI parse diagnostics are path-anchored for user files.
- Lowering parse diagnostics may use synthetic source names.
- LSP has cold-parse and warm-snapshot paths but must align on rule outcomes.

---
title: Workspace resolution contract - Examples
description: Practical examples of manifest graph resolution and target path selection.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- **Single project:** `Project.proj` with one target yields one-entry `CompilePlan`; `resolve_input` points directly to that entry file.
- **Workspace with deps:** root target depends on local and registry packages; graph includes both, unresolved optional packages are reported according to policy.
- **Explicit file compile:** `beskid run Src/Main.bd` bypasses target inference and resolves directly from the provided file path.

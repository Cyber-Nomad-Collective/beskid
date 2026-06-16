---
title: Workspace resolution contract - Contracts and edge cases
description: Normative guarantees and failure behavior for manifests, graph
  resolution, and root selection.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- Missing or malformed project manifests must produce stable project diagnostics, not parser panics.
- Unresolved dependencies must follow the selected policy and remain observable in command output.
- Explicit source-file input takes precedence over workspace target inference.
- Resolution must preserve deterministic target selection for identical manifests and lockfiles.

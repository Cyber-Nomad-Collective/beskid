---
title: Stage ordering and lowering - Contracts and edge cases
description: Required ordering guarantees and behavior under parse or semantic failures.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- Build and run command paths must use the same lowering order for parity.
- Semantic error diagnostics must stop lowering before backend code generation.
- Parse diagnostics source naming differences must be documented (`path` vs `"<memory>"`).
- Entrypoint lookup must use post-resolution typed metadata from the same lowering result.

---
title: Diagnostics parity (CLI and LSP) - Contracts and edge cases
description: Required parity behavior and accepted differences between diagnostic surfaces.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-29
---

- Semantic error presence/absence **must** match across CLI analyze, `beskid build`, and LSP for equivalent project source (D-COMP-BUILD-0012, D-COMP-BUILD-0024).
- **Analyze/run divergence is forbidden**: CLI semantic gates and execute paths **must** use the same `prepare_compilation` spine (post-rewrite AST); differing diagnostic sets on the same buffer are regressions.
- Source label differences are **allowed** when paths intentionally differ (`path`, `source.bd`, `"<memory>"`)—labels alone are not parity failures.
- Manifest (`.proj`) diagnostics must use project-error mapping paths, not code-file parsers.
- Project `.bd` files **must not** fall back to parse-only semantic tiers in LSP; non-project buffers may use limited single-file fallback.
- Snapshot reuse in LSP must not hide newly introduced semantic errors; invalidate when manifest, workspace graph, or buffer version changes.

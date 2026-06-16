---
title: Contracts and edge cases
description: Strict guarantees for LSP snapshot lifecycle and refresh behavior.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Contracts

- **Open buffer wins** — Disk index **must not** overwrite an open `Document` for the same `Uri`.
- **Monotonic versions** — Stale `didChange` versions **must** be ignored per LSP rules.
- **Cache generation** — When `ANALYSIS_CACHE_VERSION` increments, all snapshots **must** rebuild even if text is unchanged.
- **Diagnostic debounce** — Only the latest scheduled revision per URI may publish; superseded tasks **must** no-op.
- **Manifest URIs** — `.proj` files **must not** run Beskid semantic analysis snapshots.
- **Parity** — Diagnostic codes and severities **must** match `beskid analyze` for the same `CompilationContext`.

## Edge cases

| Case | Behavior |
| --- | --- |
| Source outside focused project tree | Fall back to focused `Project.proj` when path is under focus root (`project_context.rs`) |
| No resolvable manifest | Analysis snapshot is `None`; features degrade gracefully without fabricated graphs |
| Large workspace scan | Progress events **must** remain cancellable by subsequent invalidation |
| Rapid typing | Text-hash fast path avoids parse until pause; debounced diagnostics may lag one generation |
| Lockfile change during edit | Hard invalidation; user may see transient empty diagnostics until rescan completes |

## Meta invalidation

Changes to `project.mod` or mod AOT outputs **must** hard-invalidate compilation cache before re-running generators. Soft paths are opt-in and require proven stable capture keys.

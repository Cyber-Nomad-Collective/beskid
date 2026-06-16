---
title: Contracts and edge cases
description: Stability guarantees for runtime-backed corelib APIs.
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

- **ABI version lockstep** — Host, runtime, and AOT artifacts **must** agree on `beskid_runtime_abi_version` for a given toolchain release.
- **No duplicate syscall paths** — Console/ANSI **must not** bypass `Core.*` stream contracts for primitive read/write.
- **Panic across unwind** — Builtin entry points use `extern "C-unwind"`; Beskid panics map through `panic_io` without corrupting GC state.
- **Documented nullability** — Beskid wrappers **must** mirror ABI nullability for handles passed into GC-aware builtins.

## Edge cases

| Case | Behavior |
| --- | --- |
| Missing runtime on link | AOT/JIT link fails at build time, not lazy runtime dlopen |
| Platform without ANSI | Console package degrades per terminal capability probes |
| Embedded hosts without stderr | `Core.Error` may alias output; documented per execution profile |
| Metrics feature gate | `beskid_runtime` metrics builtins compile only with `metrics` feature |

## Non-runtime corelib

Pure Beskid modules in `foundation` and similar packages are out of scope here—they follow standard IL lowering without builtin tables.

---
title: Verification and traceability
description: Verification for runtime-backed corelib surfaces.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Automated gates

| Gate | Location |
| --- | --- |
| ABI ↔ runtime export parity | `compiler/crates/beskid_tests/src/abi/contracts.rs` |
| AOT ABI version constant | `beskid_aot` + CLI build tests |
| Corelib compile smoke | `beskid_tests/src/projects/corelib/compile.rs` |

## Traceability matrix

| Surface area | Spec article | Code |
| --- | --- | --- |
| Syscall I/O | This feature + console-io-streams | `panic_io`, `System.*` |
| Fibers / GC | execution/runtime features | `fiber`, `gc` modules |
| Console ANSI | terminal-and-console area | `packages/console` |

## Release process

Runtime ABI bumps require: update `beskid_abi`, runtime implementations, ABI tests, platform-spec execution pages, and this feature bundle in one toolchain release.

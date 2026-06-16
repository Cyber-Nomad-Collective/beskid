---
title: Hard ABI version check before user code
description: Hosts reject mismatched compiler and runtime ABI integers before
  executing generated code.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-ABI-0001
adrStatus: Accepted
adrDate: 2025-11-01
lastReviewed: 2026-05-22
---

## Context

JIT and CLI hosts may load a `beskid_runtime` artifact built separately from the active compiler. Without an explicit version gate, stale toolchains call builtins with wrong layouts or missing symbols.

## Decision

| Rule | Detail |
| --- | --- |
| Version surface | `beskid_runtime_abi_version()` returns `BESKID_RUNTIME_ABI_VERSION` (`u32` in `beskid_abi`) |
| Host check | Hosts **should** fail before user `main` when runtime version ≠ compiler-embedded constant (**ABI-003**) |
| Diagnostics | Failure messages **must** name both integers and recommend aligning CLI/VSIX/runtime release sets |

## Consequences

Release matrices document paired compiler/runtime builds. Conformance **should** assert version parity in JIT smoke tests (`beskid_tests` runtime/jit).

## Verification anchors

`compiler/crates/beskid_abi/src/version.rs`; `beskid_engine` JIT module setup; **ABI-001**–**ABI-003** in [contracts and edge cases](../contracts-and-edge-cases/).

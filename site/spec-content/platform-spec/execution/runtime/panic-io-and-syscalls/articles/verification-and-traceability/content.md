---
title: Verification and traceability
description: panic_io implementation paths, e2e runtime cases, and IO contract cross-tests.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

## Implementation anchors

| Path | Role |
| --- | --- |
| `compiler/crates/beskid_runtime/src/builtins/panic_io.rs` | `panic`, `panic_str`, `syscall_read`, `syscall_write` |
| `compiler/crates/beskid_runtime/src/builtins/mod.rs` | Re-exports |
| `compiler/crates/beskid_abi/src/builtins.rs` | Signatures for IO/panic |
| `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` | End-to-end panic/IO |
| `compiler/corelib/.../System/Syscall/` | Descriptor routing (corelib tests) |

## Requirement traceability

| ID | Evidence |
| --- | --- |
| **IO-ABI-001** | Cranelift unreachable block after `panic` calls in codegen tests |
| **IO-ABI-002** | Shared `BUILTIN_SPECS` across `beskid_engine` and AOT link |
| **IO-ABI-005** | Code review: no CLIF syscall intrinsics in `beskid_codegen` for stdio |
| Console **IO-004** | `corelib_tests` console paths |

## CI

Compiler workspace runs `beskid_e2e_tests` runtime cases on Linux agents. Platform spec edits **should** trigger `bun run verify:trudoc` under `site/website` when frontmatter changes.

## Related topics

- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Builtins verification](/platform-spec/execution/abi-and-host/builtins-and-symbols/verification-and-traceability/)

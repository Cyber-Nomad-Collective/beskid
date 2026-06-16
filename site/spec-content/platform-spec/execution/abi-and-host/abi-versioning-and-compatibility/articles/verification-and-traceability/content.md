---
title: Verification and traceability
description: Tests and crate paths that pin ABI version and runtime export symbol parity.
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

## Source-of-truth crates

| Path | What it pins |
| --- | --- |
| `compiler/crates/beskid_abi/src/version.rs` | `BESKID_RUNTIME_ABI_VERSION` |
| `compiler/crates/beskid_abi/src/symbols.rs` | `RUNTIME_EXPORT_SYMBOLS`, `SYM_*` constants |
| `compiler/crates/beskid_abi/src/builtins.rs` | `BUILTIN_SPECS` signatures |
| `compiler/crates/beskid_runtime/src/builtins/version.rs` | `beskid_runtime_abi_version()` export |
| `compiler/crates/beskid_engine/src/jit_module.rs` | Builtin pointer registration for JIT |

## Integration tests

| Harness | Coverage |
| --- | --- |
| `compiler/crates/beskid_tests/src/runtime/jit.rs` | JIT compiles and runs lowered programs against in-process runtime |
| `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` | End-to-end runtime builtins including panic/IO paths |
| `compiler/crates/beskid_engine` (feature `extern_dlopen`) | Dynamic extern resolution when enabled; see [Extern dispatch](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/) |

## Traceability matrix

| Requirement | Verification |
| --- | --- |
| **ABI-001** | Review `RUNTIME_EXPORT_SYMBOLS` vs `beskid_runtime` `pub use` list on every ABI-touching PR |
| **ABI-002** | `declare_builtin_imports` uses `BUILTIN_SPECS` exclusively (`beskid_codegen`) |
| **ABI-003** | Host/version gate tests in JIT and CLI startup (add when missing) |
| **ABI-006** | Same `beskid_abi` path dependency in `beskid_engine`, `beskid_codegen`, and `beskid_runtime` workspace `Cargo.toml` |

## CI expectations

Compiler workspace CI **must** run runtime JIT tests on Linux x86_64 agents. ABI-breaking PRs **must** include spec updates under this feature and a version constant bump when **ABI-004** applies.

## Implementation anchors
- `compiler/crates/beskid_abi/src/version.rs` — ABI version constant for CI assertions
- `compiler/crates/beskid_abi/src/symbols.rs` — symbol list parity checks
- `compiler/crates/beskid_tests/src/abi/` — ABI conformance fixtures

## Related topics

- [Contracts and edge cases](./contracts-and-edge-cases/) — requirement IDs
- [Builtins and symbols verification](/platform-spec/execution/abi-and-host/builtins-and-symbols/verification-and-traceability/)

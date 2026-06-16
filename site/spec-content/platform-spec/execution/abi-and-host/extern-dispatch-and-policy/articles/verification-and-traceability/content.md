---
title: Verification and traceability
description: Engine extern tests, analysis diagnostics, and interop layout traceability.
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
| `compiler/crates/beskid_analysis/src/beskid.pest` | `Extern` syntax |
| `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs` | Extern-related diagnostics |
| `compiler/crates/beskid_abi/src/builtins.rs` | `interop_dispatch_*` in `BUILTIN_SPECS` |
| `compiler/crates/beskid_codegen` | `declare_validated_extern_imports`, signature validation |
| `compiler/crates/beskid_engine` | `extern_dlopen` tests, `new_with_symbols` |
| `compiler/crates/beskid_runtime/src/interop/` | Dispatch implementations |
| `compiler/crates/beskid_runtime/src/interop_layout.rs` | Tag/payload offsets |

## Test matrix

| Test (engine) | Asserts |
| --- | --- |
| `extern_resolution_only_compiles_with_feature` | Resolution succeeds when feature on |
| `extern_real_call_getpid` | Live call returns plausible PID |
| `extern_resolution_fails_without_feature` | **EXT-001** style failure |
| `extern_missing_symbol_errors` | `dlsym` diagnostic quality |
| `extern_missing_library_errors` | `dlopen` diagnostic quality |

## Requirement traceability

| ID | Evidence |
| --- | --- |
| **EXT-001** | `extern_resolution_fails_without_feature` |
| **EXT-002** | `ExternDeclarationError::InvalidSignature` unit paths in codegen |
| **EXT-003–004** | Engine cache tests + code review of `dlopen` flags |
| **EXT-005** | `interop_layout.rs` + runtime dispatch tests |

## Related topics

- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Builtins and symbols](/platform-spec/execution/abi-and-host/builtins-and-symbols/verification-and-traceability/)

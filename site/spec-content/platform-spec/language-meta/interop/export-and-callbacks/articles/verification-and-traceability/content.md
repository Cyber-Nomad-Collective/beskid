---
title: Export and callbacks — Verification and traceability
description: Conformance fixtures for Export and callback registration (v0.3).
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-23
---

## Reference compiler status

| Surface | Status | Primary verification |
| --- | --- | --- |
| `[Export(Abi:"C", Symbol:"...")]` on `pub fn` | Implemented (codegen + AOT) | `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs::export_plugin_init_visible_to_linker` |
| Callback registration `beskid_register_callbacks` + layout band | Implemented (runtime export) | `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs::host_registers_callbacks_with_layout_band` |
| Link-time `Extern` via project `link` / `external_libraries` | Implemented (AOT linker, Linux tier-1) | `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs::link_time_extern_getpid_matches_platform_spec` |
| `Export` on non-`pub` function | Codegen diagnostic | `compiler/crates/beskid_tests/src/interop/export.rs::export_on_non_pub_function_fails_codegen` |

## Verification anchors

- Engine (Linux tier-1): `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs` — link-time `getpid`, shared-library export visibility, callback layout-band gate.
- Integration: `compiler/crates/beskid_tests/src/interop/export.rs`, `compiler/crates/beskid_tests/src/interop/callback.rs`.
- Codegen export metadata: `compiler/crates/beskid_codegen/src/lowering/expressions/export.rs`, `compiler/crates/beskid_codegen/src/lowering/context.rs` (`CodegenArtifact::exports`).
- AOT export table: `compiler/crates/beskid_aot/src/export_table.rs`.
- Runtime callback registration: `compiler/crates/beskid_runtime/src/builtins/callback.rs` (`beskid_register_callbacks`).
- ABI symbols: `compiler/crates/beskid_abi/src/symbols.rs` (`SYM_BESKID_REGISTER_CALLBACKS`, `BESKID_USER_FFI_LAYOUT_BAND`), `compiler/crates/beskid_abi/src/builtins.rs` (`BUILTIN_SPECS`).

## Runtime ABI

Adding **user export symbols** **must not** change `RUNTIME_EXPORT_SYMBOLS` unless a new **runtime-provided** registrar is promoted to the Rust ABI profile. `beskid_register_callbacks` is a runtime export for host registration; user `[Export]` symbols remain generated from Beskid compilation units.

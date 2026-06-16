---
title: Contracts and edge cases
description: MUST rules for extern validation, dynamic linking policy, and
  interop dispatch layout.
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

## Normative requirements

| ID | Requirement |
| --- | --- |
| **EXT-001** | If dynamic extern resolution is disabled, compilation **must** fail when the artifact references extern symbols, listing each unresolved import. |
| **EXT-002** | Engine-validated extern signatures **must** use only approved scalar Cranelift kinds; all other types **must** be rejected. |
| **EXT-003** | Dynamic loading on Linux **must** use `RTLD_LOCAL \| RTLD_NOW`; error paths **must** surface `dlerror()` text. |
| **EXT-004** | `(library, symbol)` resolution **must** be cached for process lifetime without double `dlopen` of the same library path. |
| **EXT-005** | `interop_dispatch_*` builtins **must** follow layouts documented in `beskid_runtime` `interop_layout.rs` for the active ABI version. |
| **EXT-006** | User-facing docs **must not** expose internal `__interop_*` mangling; stable names are `interop_dispatch_*` only. |

## Edge cases

| Case | Behavior |
| --- | --- |
| Missing shared library | Compile/link failure with library path in diagnostic when dynamic path enabled |
| Missing symbol | `dlsym` failure with symbol + library name |
| Extern in artifact, feature off | Fail fast (**EXT-001**); no silent stub addresses |
| Mixed link-time + dynamic in one workspace | Each artifact follows its manifest/link profile; engine caches are per-process |
| Non-Linux host with `extern_dlopen` | Unsupported; compilation or tests **should** skip with explicit platform guard |

## SHOULD guidance

- New packages **should** use link-time [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/) rather than `extern_dlopen`.
- Panic from foreign code **should** be treated as process-fatal; Beskid does not translate C aborts into `Option`.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/` — extern validation diagnostics and feature gating
- `compiler/crates/beskid_engine/src/` — optional `extern_dlopen` path
- `compiler/crates/beskid_runtime/src/interop/` — runtime panic policy for foreign code

## Related topics

- [FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)
- [Panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/)

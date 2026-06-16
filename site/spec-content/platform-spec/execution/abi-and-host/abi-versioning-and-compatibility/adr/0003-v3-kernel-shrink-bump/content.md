---
title: ABI v3 kernel shrink bump
description: v3 breaking change — kernel-only direct exports; soft ops behind dispatch.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-ABI-0009
adrStatus: Accepted
adrDate: 2026-06-06
lastReviewed: 2026-06-06
---

## Context

ABI v2 exported every runtime builtin as a direct linker symbol (~80 entries). v3 introduces manifest-driven classification and dispatch envelopes — a breaking shrink of the stable export surface.

## Decision

| Rule | Detail |
| --- | --- |
| Version | `BESKID_RUNTIME_ABI_VERSION` **must** increment **2 → 3** at the v3 cutover |
| Kernel only | `RUNTIME_EXPORT_SYMBOLS` in v3 lists **kernel** exports and dispatch entrypoints only |
| Soft ops | Legacy direct symbols (for example `str_len`, `channel_send`) **must not** appear in v3 export lists |
| Archives | Prebuilt runtime archives **must** publish under `lib/beskid-runtime/abi-3/` |
| Rejection | Loaders **must** reject v2 artifacts when the compiler advertises ABI v3 |
| User C extern | User `Extern` C ABI plane **unchanged** per [D-LMETA-FFI-0004](/platform-spec/language-meta/interop/ffi-and-extern/adr/0004-user-cabi-vs-runtime-rustabi/) |

Envelope layout changes after v3 follow [D-EXEC-ABI-0002](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/adr/0002-breaking-changes-bump-version/).

## Consequences

Release notes **must** document v3 migration, rebuilt archives, and removed direct soft symbols. Conformance tests freeze the v3 kernel allowlist.

## Verification anchors

`compiler/crates/beskid_abi/src/version.rs`; `compiler/crates/beskid_aot/src/bundled.rs`; `compiler/crates/beskid_tests/src/abi/contracts.rs`.

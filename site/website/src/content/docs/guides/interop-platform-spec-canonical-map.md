---
title: Interop platform-spec canonical map
description: Maintainer URL table for Interop.Contracts, C and Rust ABI profiles, and paired execution chapters.
---

# Interop platform-spec canonical map

Maintainer reference: authoritative URLs after the **Interop.Contracts** cutover. Use this when updating links, redirects, or CI fixtures.

## Canonical feature hubs (under Language meta → Interop)

| Topic | URL |
| --- | --- |
| Interop area hub | `/platform-spec/language-meta/interop/` |
| **Interop.Contracts** (language-agnostic primitives) | `/platform-spec/language-meta/interop/interop-contracts/` |
| **C ABI profile** (extern, System V, linking policy) | `/platform-spec/language-meta/interop/c-abi-profile/` |
| **Rust ABI profile** (embedding, runtime exports, stability) | `/platform-spec/language-meta/interop/rust-abi-profile/` |
| **FFI and extern** (language surface: `Extern` on contracts) | `/platform-spec/language-meta/interop/ffi-and-extern/` |

## Execution runtime chapters (implementation detail; pair with language-meta)

| Topic | URL |
| --- | --- |
| FFI lowering and Cranelift | `/execution/runtime/ffi/` |
| Syscalls vs extern vs runtime | `/execution/runtime/syscalls-and-abi-boundary/` |
| Extern dlopen policy | `/execution/runtime/extern-policy-v0-1/` |
| Runtime ABI symbol inventory | `/execution/runtime/runtime-abi-v0-1/` |

## Replacement notes

- Old single placeholder at `ffi-and-extern` is now the **language-level** chapter; normative abstract contracts live under **interop-contracts**; C-specific and Rust-specific profiles live under **c-abi-profile** and **rust-abi-profile**.
- External links that still target `/platform-spec/language-meta/interop/ffi-and-extern/` remain valid.

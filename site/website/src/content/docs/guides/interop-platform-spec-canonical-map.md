---
title: Interop platform-spec canonical map
description: Maintainer URL table for v0.3 FFI, Interop.Contracts, profiles, tooling, and paired execution chapters.
---

# Interop platform-spec canonical map

Maintainer reference: authoritative URLs for **v0.3 FFI**. Use when updating links, redirects, or CI fixtures.

## v0.3 delivery summary

| Band | Standard in spec | Implementation |
| --- | --- | --- |
| **v0.3.0** | Interop views, link-time import, `Symbol` overrides, export + callbacks | May trail spec |
| **v0.3.1** | `CLayout` primitive structs | Proposed |
| **Later** | Nested FFI structs, enum ABI, foreign-thread entry | After basic FFI |

**Runtime ABI** (`BESKID_RUNTIME_ABI_VERSION`) is **unchanged** by user FFI layout bands (`BESKID_USER_FFI_LAYOUT_BAND`).

## Canonical feature hubs (Language meta → Interop)

| Topic | URL |
| --- | --- |
| Interop area hub | `/platform-spec/language-meta/interop/` |
| **Interop.Contracts** | `/platform-spec/language-meta/interop/interop-contracts/` |
| **FFI and extern** (hub + articles) | `/platform-spec/language-meta/interop/ffi-and-extern/` |
| **Export and callbacks** | `/platform-spec/language-meta/interop/export-and-callbacks/` |
| **C ABI profile** | `/platform-spec/language-meta/interop/c-abi-profile/` |
| **Rust ABI profile** (runtime only) | `/platform-spec/language-meta/interop/rust-abi-profile/` |

## Tooling

| Topic | URL |
| --- | --- |
| **Foreign library import** | `/platform-spec/tooling/foreign-library-import/` |
| **Project link libraries** | `/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/project-link-libraries/` |

## Execution runtime chapters (implementation; pair with language-meta)

| Topic | URL |
| --- | --- |
| FFI lowering and Cranelift | `/execution/runtime/ffi/` |
| Syscalls vs extern vs runtime | `/execution/runtime/syscalls-and-abi-boundary/` |
| Legacy dlopen policy | `/execution/runtime/extern-policy-v0-1/` |
| Dynamic resolution (platform-spec) | `/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/` |
| Runtime ABI symbol inventory | `/execution/runtime/runtime-abi-v0-1/` |

## Stdlib policy

**WinAPI** / stdcall is **out of scope** for stdlib Standard — see [platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/).

## Replacement notes

- `/platform-spec/language-meta/interop/ffi-and-extern/` is a **feature hub** (directory with `index.mdx`), not a single flat page.
- `node packages/trudoc/scripts/generate-language-meta-tree.mjs` **does not overwrite** existing area/feature pages (use `--force` only when intentionally regenerating minimal stubs).
- User FFI layout versioning is documented under [conformance and versioning](/platform-spec/language-meta/interop/interop-contracts/conformance-and-versioning/).

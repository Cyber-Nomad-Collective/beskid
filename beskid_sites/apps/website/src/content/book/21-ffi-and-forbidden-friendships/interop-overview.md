---
title: "Interop overview"
description: Language-meta interop domain and how profiles bind primitives.
tableOfContents: true
---

Start at [Interop](/platform-spec/language-meta/interop/). Profiles define which boundary is supported: [C ABI](/platform-spec/language-meta/interop/c-abi-profile/) is the user-authored foreign-code boundary, while [Rust ABI](/platform-spec/language-meta/interop/rust-abi-profile/) documents the language-owned runtime. Higher-level mapping rules live under [Interop contracts](/platform-spec/language-meta/interop/interop-contracts/). ABI v4 narrows the stable runtime surface to **kernel exports** plus **dispatch envelope layout**—soft ops route through tags, not ~80 direct linker symbols.

> **Caution:** A user-authored `extern` target must use the [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/). To call a Rust library, expose a C-compatible shim and declare that shim as the target; do not link the crate through the Rust ABI profile. That profile is runtime-only.

See [runtime registration](/platform-spec/core-library/compiler-integration/runtime-registration/) only when working on the language-owned runtime's handler tables and status codes.

## Pick the owner before the mechanism

Use the Interop domain for source-level declarations and profile selection. Use the execution ABI pages for host dispatch, and use core-library integration pages only where they are explicitly linked by the chosen profile. This prevents an implementation convenience from being mistaken for a portable application boundary.

## Reading route

1. Read [Interop](/platform-spec/language-meta/interop/) for the category of boundary.
2. For user code, select [C ABI](/platform-spec/language-meta/interop/c-abi-profile/); use [Rust ABI](/platform-spec/language-meta/interop/rust-abi-profile/) only for runtime integration.
3. Follow to [extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/) when host behavior matters.

## Hub

[21. FFI](/book/21-ffi-and-forbidden-friendships/)

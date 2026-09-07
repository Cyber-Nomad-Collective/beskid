---
title: "Rust ABI profile"
description: Runtime-facing Rust ABI—not arbitrary crate imports.
tableOfContents: true
---

[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/) documents the language-owned runtime's boundary stability, [runtime manifest](/platform-spec/language-meta/interop/rust-abi-profile/runtime-manifest/), and ABI v4 [kernel and dispatch](/platform-spec/language-meta/interop/rust-abi-profile/kernel-and-dispatch/) model. The runtime exposes stable C-compatible entrypoints to loaders; Rust-specific choices stay inside its crate boundary.

> **Caution:** This is a runtime-only profile, not a Rust-native application FFI. A user-authored `extern` target must stay on the [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/). When that target is implemented in Rust, provide a C-compatible shim rather than linking the Rust crate through this profile.

## Treat the profile as an integration contract

Read the profile when changing runtime integration. It defines the supported runtime surface; ordinary Rust crate APIs are not part of a user `extern` surface. For application interop, design the C contract and shim first. When runtime work directs you to registration or dispatch details, follow those links rather than relying on private symbols.

## Next

[Export and callbacks](/book/21-ffi-and-forbidden-friendships/export-and-callbacks/)

## Hub

[21. FFI](/book/21-ffi-and-forbidden-friendships/)

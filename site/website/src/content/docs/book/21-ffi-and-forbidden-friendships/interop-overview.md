---
title: "Interop overview"
description: Language-meta interop domain and how profiles bind primitives.
tableOfContents: true
---

Start at [Interop](/platform-spec/language-meta/interop/). Profiles (C ABI, Rust ABI) define how primitive data crosses boundaries; higher-level mapping rules live under [Interop contracts](/platform-spec/language-meta/interop/interop-contracts/). ABI v3 narrows the stable Rust runtime surface to **kernel exports** plus **dispatch envelope layout**—soft ops route through tags, not ~80 direct linker symbols.

**User extern** is not "link any Rust crate you found on crates.io"—read the Rust ABI profile before you `@extern` a dependency into production. See [runtime registration](/platform-spec/core-library/compiler-integration/runtime-registration/) for how corelib owns handler tables and status codes.

## Hub

[21. FFI](/book/21-ffi-and-forbidden-friendships/)

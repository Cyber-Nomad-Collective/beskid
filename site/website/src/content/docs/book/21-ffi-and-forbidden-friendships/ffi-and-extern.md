---
title: "FFI and extern"
description: extern attributes and contract-level imports.
tableOfContents: true
---

[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/) owns `extern` schema and contract import syntax. Mod-level extern shortcuts are deferred—do not invent them in application code because a blog post from 2014 said so.

Execution owns dispatch policy once the language boundary is chosen: [Extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/).

## Separate declaration from dispatch

The interop feature tells you how source code declares a boundary. Dispatch policy covers what the host does after that boundary has been selected. Read both when implementing an integration, but do not use an execution detail to invent a source-level declaration form.

## Next

[C ABI profile](/book/21-ffi-and-forbidden-friendships/c-abi-profile/) or [Rust ABI profile](/book/21-ffi-and-forbidden-friendships/rust-abi-profile/)

## Hub

[21. FFI](/book/21-ffi-and-forbidden-friendships/)

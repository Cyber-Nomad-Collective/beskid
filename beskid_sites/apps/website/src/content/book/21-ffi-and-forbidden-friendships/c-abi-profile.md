---
title: "C ABI profile"
description: Link-time linking and dynamic resolution tiers.
tableOfContents: true
---

The [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/) covers link-time linking, dynamic resolution, and platform-specific notes (including what is intentionally *not* in stdlib).

Pair with chapter 18 when the question is manifest `link` entries vs calling convention.

## Use the profile before designing the boundary

First identify the external library and the direction of the call. Then read the profile's supported boundary shape and the project configuration guidance together. A manifest describes how a project supplies a dependency; the ABI profile governs the language-level interop boundary.

For dispatch behavior after an import is chosen, continue with [extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/).

## Hub

[21. FFI](/book/21-ffi-and-forbidden-friendships/)

---
title: "Runtime-backed surfaces"
description: Some corelib APIs are thin wrappers over runtime builtins; know the boundary before you blame the language.
tableOfContents: true
---

Not every stdlib function is a pure Beskid algorithm you can read over coffee. Some surfaces are **runtime-backed**: fibers, channels, syscall bridges, and other contracts where getting it wrong means blaming the runtime team in all caps.

## How to tell

- Platform-spec marks runtime-backed areas explicitly—start at [Runtime-backed corelib surfaces](/platform-spec/core-library/stability-and-api-shape/runtime-backed-corelib-surfaces/).
- Implementation lives split between `beskid_corelib` packages and `packages/runtime` / `beskid_runtime`—the book is not a substitute for the crate map in [chapter 13](/book/13-reading-the-law/).

## Stability

Corelib API shape tiers are normative under [Stability and API shape](/platform-spec/core-library/stability-and-api-shape/). Shipping breaking changes without a spec delta is how you lose friends at code review.

## Next chapter

[17. Execution: ABI, host, and runtime](/book/17-execution-abi-host-runtime/)

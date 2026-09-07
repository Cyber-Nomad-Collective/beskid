---
title: "CLIF and debug"
description: Inspect Cranelift IR with beskid clif and debug flags without guessing lowering.
tableOfContents: true
---

When lowering misbehaves, reading Rust alone is masochism. **`beskid clif`** dumps Cranelift IR so you can correlate machine intent with source.

## CLI

Reference: [beskid clif](/book/reference/cli/commands/clif/).

Typical uses:

- Verify spawn/fiber lowering produced expected blocks
- Compare JIT vs AOT IR for the same function
- Attach IR to bug reports **with** the spec/feature link

## Debug flags

Compiler logging and phase traces align with `beskid_pipeline` phase IDs—see [Pipeline composition](/platform-spec/compiler/pipeline-composition/) and book chapter [02 tooling — logging](/book/02-path-not-found-tooling-anyway/logging-and-debug-flags/) for operator-facing flags.

## Spec anchors

- [Diagnostics parity](/platform-spec/compiler/build-pipeline/diagnostics-parity/)
- [Backends JIT/AOT](/platform-spec/compiler/build-pipeline/backends-jit-aot/)

## What CLIF is not

- Not a substitute for semantic diagnostics—fix types first.
- Not a public stability contract for third-party tools—IR details may shift with Cranelift updates.

## Next chapter

[15. Mods: plugins with consequences](/book/15-mods-plugins-with-consequences/)

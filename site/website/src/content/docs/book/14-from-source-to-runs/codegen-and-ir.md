---
title: "Codegen and IR"
description: TypedProgram to CodegenInput, ISLE emission, and Cranelift IR.
tableOfContents: true
---

Code generation converts typed syntax facts into **machine-oriented artifacts** for AOT commands and the separate JIT test and REPL paths.

## Entry

The production boundary is `TypedProgram` → `CodegenInput` → ISLE emission → `CodegenArtifact`. See [Build pipeline overview](/docs/standard/compiler/build-pipeline/) and [Backends JIT/AOT](/docs/standard/compiler/build-pipeline/backends-jit-aot/).

## Responsibilities

| Output | Consumer |
| --- | --- |
| `CodegenArtifact` | `beskid_engine` (JIT), `beskid_aot` (object/link) |
| ABI metadata | `beskid_abi` tables consumed by runtime |

## Mod interaction

Typed emitter/transform contracts: [Typed emitter and transforms](/docs/standard/compiler/compiler-mods/typed-emitter-and-transforms/). Lowering runs **after** merged typed AST is valid.

## Fibers and builtins

Spawn lowers to `fiber_spawn`; builtins align with [Builtins and symbols](/docs/standard/execution/abi-and-host/builtins-and-symbols/)—codegen must not invent alternate calling conventions.

## Next

[AOT run and interactive JIT](/book/14-from-source-to-runs/jit-run/)

---
title: "Codegen and IR"
description: beskid_codegen lowering to CodegenArtifact and Cranelift IR.
tableOfContents: true
---

Lowering is where typed programs become **machine-oriented artifacts** the engine can JIT or AOT.

## Entry

`beskid_codegen::lower_source` / `lower_program` — see [Build pipeline overview](/platform-spec/compiler/build-pipeline/) and [Backends JIT/AOT](/platform-spec/compiler/build-pipeline/backends-jit-aot/).

## Responsibilities

| Output | Consumer |
| --- | --- |
| `CodegenArtifact` | `beskid_engine` (JIT), `beskid_aot` (object/link) |
| ABI metadata | `beskid_abi` tables consumed by runtime |

## Mod interaction

Typed emitter/transform contracts: [Typed emitter and transforms](/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/). Lowering runs **after** merged typed AST is valid.

## Fibers and builtins

Spawn lowers to `fiber_spawn`; builtins align with [Builtins and symbols](/platform-spec/execution/abi-and-host/builtins-and-symbols/)—codegen must not invent alternate calling conventions.

## Next

[JIT run](/book/14-from-source-to-runs/jit-run/)

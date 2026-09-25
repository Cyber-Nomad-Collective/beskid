---
title: "Codegen and IR"
description: Typed program to codegen input, ISLE rules to Cranelift IR, and why the lowering is written as rewrite rules instead of a Rust match.
tableOfContents: true
---

Lowering is where a checked program becomes instructions.

```text
TypedProgram ──► CodegenInput ──► ISLE rules ──► CLIF ──► machine code
 beskid_queries   beskid_codegen   beskid_isle    Cranelift
```

`beskid_codegen` takes the typed program from the query database and produces a `CodegenInput`: functions, layouts, the runtime symbols each function needs. `beskid_isle` holds the rules that turn each construct into Cranelift IR. Cranelift turns the IR into machine code for the target triple. The IR is verified by Cranelift's own verifier before it is compiled; a lowering rule that emits ill-formed CLIF fails the build with the verifier's message, not a crash in the generated program.

## Why ISLE

ISLE is the term-rewriting language Cranelift uses for its own instruction selection. A rule says "this pattern of typed input becomes this sequence of IR", and the rules compose. Beskid's lowering is written in it for two reasons.

The first is that a rule is reviewable. `control_flow.isle` says what a `match` becomes. You can read it without following a thousand-line Rust function through its helper calls.

The second is the long game. Pieces of the runtime that are Rust today are being moved to Beskid, and each move is a new set of ISLE rules that lower the Beskid version instead of calling the Rust one. The `clif { ... }` block in the grammar exists for that work: a Beskid function whose body is raw IR, for the handful of places where the language cannot yet express what the runtime needs.

## What lowering owns

- **Specialization.** Generics are monomorphized here. `List<Invoice>` and `List<i64>` are separate functions with separate layouts. Zero-sized type arguments are erased at the ABI boundary while their enum layouts are kept, which is how `Fiber<unit>.Join()` works without a phantom byte.
- **Fibers.** `spawn` lowers to `fiber_spawn` with the closure environment rooted for the collector; on Linux x86-64 a fiber switch is a tail transfer, not a function call.
- **Contract calls.** A parameter typed by a contract is specialized per concrete type. No vtable is emitted because no dynamic dispatch exists to need one.
- **ABI.** Layouts, symbol names, and the transport slot for managed values crossing into the runtime come from `beskid_abi` and the runtime manifest, so generated code and `beskid_runtime` agree by construction rather than by convention.

## Seeing the output

`beskid clif file.bd` prints the CLIF for a file's entry. It is the last page of this chapter and the first thing to attach to a lowering bug report.

Contracts: [backends](/platform-spec/compiler/build-pipeline/backends-jit-aot/), [codegen and IR](/platform-spec/compiler/codegen-and-ir/), [builtins and symbols](/platform-spec/execution/abi-and-host/builtins-and-symbols/).

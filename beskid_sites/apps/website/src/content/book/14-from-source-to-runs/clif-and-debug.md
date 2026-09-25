---
title: "CLIF and debug"
description: Read the Cranelift IR the compiler emitted, log the backend, and know what to attach to a lowering bug.
tableOfContents: true
---

When a program type-checks and then does the wrong thing at runtime, the question is what the compiler emitted. Reading the Rust lowering to guess is masochism. Reading the IR is faster.

```bash
beskid clif Src/Main.bd
beskid clif --project ./MyApp.bproj --target App
```

`clif` resolves and lowers the program and prints the rendered CLIF for the entry and everything it reaches. Each function's IR comes out after the Cranelift verifier has accepted it, so what you see is what the backend compiled.

## What to look for

- **A `match` that took the wrong arm.** Find the block structure the `match` lowered to and check the comparison against the discriminant. Enum layouts are in the IR as loads at fixed offsets.
- **A `spawn` that does not run.** Look for `fiber_spawn` and the environment it captured. A missing capture means the closure lowering dropped a root; a present capture with the wrong stack map means the collector may move it.
- **A contract call that hit the wrong specialization.** The callee name includes the concrete type it was specialized for. If it names a type you did not expect, the conformance query resolved something you did not expect, and that is a semantic question before it is a codegen one.

## Backend logging

```bash
beskid build Src/Main.bd --log-cranelift
BESKID_LOG_CRANELIFT=1 beskid run Src/Main.bd
```

The global `--log-cranelift` flag, or the environment variable, turns on Cranelift's own backend logging: register allocation, instruction selection, the passes it ran. It is verbose and it is for one function at a time. Shrink the file first.

## Attaching to a bug report

Three things, in this order: the source that reproduces it, the `beskid clif` output for that file, and the link to the standard's feature that says what the construct should do. The third one is not ceremony. A lowering is wrong relative to a rule, and a report that names the rule is one that can be fixed without a discussion about what the rule was.

## What CLIF is not

It is not stable. Cranelift's IR changes across Cranelift releases and the lowering rules change across Beskid releases; tooling that parses `clif` output is tooling with a short life. It is also not the place to debug type errors. If `analyze` is red, `clif` will not run, and if `analyze` is green and the IR looks wrong, the semantic pipeline is still the first suspect.

Contracts: [diagnostics parity](/platform-spec/compiler/build-pipeline/diagnostics-parity/), [backends](/platform-spec/compiler/build-pipeline/backends-jit-aot/). Command reference: [beskid clif](/book/reference/cli/commands/clif/).

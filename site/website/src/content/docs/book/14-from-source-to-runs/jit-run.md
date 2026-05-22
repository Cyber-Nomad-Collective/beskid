---
title: "JIT run"
description: beskid_engine run_entrypoint, JIT modules, and quick iteration.
tableOfContents: true
---

**JIT** is the "run what I just compiled" path: artifact in memory, entrypoint invoked through `beskid_engine`.

## Crates

| Crate | Role |
| --- | --- |
| `beskid_engine` | `run_entrypoint`, module registration, extern validation |
| `beskid_runtime` | Builtins, GC hooks, fiber scheduler |
| `beskid_abi` | Symbol tables, version exports |

Spec: [Backends JIT/AOT](/platform-spec/compiler/build-pipeline/backends-jit-aot/), [Program assembly](/platform-spec/compiler/build-pipeline/program-assembly/).

## CLI

```bash
beskid run --project path/to/Project.proj
```

Behavior must match analyze/build resolution ([CLI contract](/platform-spec/tooling/cli/build-analyze-run-contract/)).

## When JIT is enough

- Local dev loops, scripting targets, compiler dogfooding.
- Tests that execute generated code in-process.

## When JIT is not enough

Shipping binaries, mod AOT registration, or deployment without a compiler on the target → [AOT build](/book/14-from-source-to-runs/aot-build/).

## Next

[AOT build](/book/14-from-source-to-runs/aot-build/)

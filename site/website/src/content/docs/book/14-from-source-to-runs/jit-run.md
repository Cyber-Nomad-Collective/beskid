---
title: "AOT run and interactive JIT"
description: The AOT run command and the separate JIT paths for tests and the REPL.
tableOfContents: true
---

Quick feedback has two paths. `beskid run` builds and links a native executable before it starts a subprocess. The REPL and the current test runner execute code in the in-process JIT engine.

## Crates

| Crate | Role |
| --- | --- |
| `beskid_engine` | `run_entrypoint`, module registration, extern validation |
| `beskid_abi` | Symbol tables, version exports |

Spec: [Backends JIT/AOT](/docs/standard/compiler/build-pipeline/backends-jit-aot/), [Program assembly](/docs/standard/compiler/build-pipeline/program-assembly/).

## AOT run command

```bash
beskid run --project path/to/App.bproj --entrypoint Main --plain
```

The command uses the same project resolution as `beskid analyze` and `beskid build`. It requires an exact ABI-v5 runtime kit. Use the [canonical run procedure](/docs/tooling/build-run-test/) for prerequisites, checks, and recovery.

## Current JIT users

- `beskid repl` evaluates interactive snippets without project resolution.
- `beskid test` discovers test items and executes them in the current in-process engine.

Do not infer deployment behavior from these JIT paths. Use `beskid build` for a persistent native artifact.

Next: [AOT build](/book/14-from-source-to-runs/aot-build/).

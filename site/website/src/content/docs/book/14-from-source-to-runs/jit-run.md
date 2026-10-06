---
title: "AOT run and interactive JIT"
description: The AOT run command, the native-process test flow, and the REPL as the remaining JIT path.
tableOfContents: true
---

Quick feedback has three paths. `beskid run` builds and links a native executable before it starts a subprocess. `beskid test` builds one AOT object and runs each selected test in a fresh native process. Only the REPL still executes code in the in-process JIT engine.

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

The command uses the same project resolution as `beskid check` and `beskid build`. It requires an exact ABI-v5 runtime kit. Use the [canonical run procedure](/docs/tooling/build-run-test/) for prerequisites, checks, and recovery.

## Native-process tests

`beskid test` discovers test items, compiles the project once into a single AOT object, and starts a fresh native process for every selected test. A crash or hang in one test cannot corrupt the next, and the code under test is the code you would ship. See [the test CLI](/book/08-green-tests-red-production/beskid-test-cli/).

## Current JIT user

- `beskid dev repl` evaluates interactive snippets without project resolution.

Do not infer deployment behavior from the REPL. Use `beskid build` for a persistent native artifact.

Next: [AOT build](/book/14-from-source-to-runs/aot-build/).

---
title: "Where JIT still lives"
description: "beskid run is not a JIT. The in-process engine backs test and repl, and that is the whole list."
tableOfContents: true
---

`beskid_engine` can take a `CodegenInput`, compile it in memory, and call an entrypoint without writing a file. Two commands use that.

## `beskid test`

```bash
beskid test --project ./MyApp.bproj --target Tests
beskid test Src/Harness.bd --include-tag fast --json
```

Test items are discovered from the syntax tree, compiled in-process, and run one by one with the runner collecting `passed`, `failed`, `skipped`, and `filtered_out`. In-process is the right choice here: a test run over a hundred items should not link a hundred binaries, and a panic in one test is caught at the fiber boundary and reported as that test's failure. Chapter 08.

## `beskid repl`

Statements and expressions, one at a time, compiled and executed as you type. It is for poking at a corelib function or checking what an expression's type is. It is not a deployment target and never will be.

## `beskid run` is AOT

```bash
beskid run --project ./MyApp.bproj --target App
beskid run Src/Main.bd --entrypoint Main
```

`run` resolves, lowers, links a real executable through `beskid_aot`, and executes it in a subprocess. The binary that runs is the binary `build` would have written. That is the reason "works under `run`, breaks when deployed" is not a bug class: there is one code path to native and both commands take it.

Ergonomically `run` feels like a scripting command. It is not one, and the deliberate cost is a link step per invocation. The benefit is that every `run` exercises the runtime kit, the linker, and the entrypoint lifecycle host that production uses.

## What JIT does not cover

Mods are AOT-only; the host loads a compiled artifact per target triple and never JITs a mod. Shipping is AOT-only. Anything you can `beskid build` goes through `beskid_aot`, and the next page is about that.

Backend contracts: [backends JIT/AOT](/platform-spec/compiler/build-pipeline/backends-jit-aot/).

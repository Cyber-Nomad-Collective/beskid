---
title: "Pipeline overview"
description: The stages between a manifest and a binary, which crate owns each one, and which CLI command stops where.
tableOfContents: true
---

| Stage | What happens | Crate |
| --- | --- | --- |
| resolution | find the manifest, walk dependencies, inject corelib, verify the lock | `beskid_analysis::projects` |
| assembly | compute the set of source roots a target reaches | `beskid_analysis` |
| parse | text to syntax tree, syntax diagnostics | `beskid_analysis::syntax`, `parser` |
| mods | optional: collect, generate, merge, re-parse | `beskid_analysis::mod_host` |
| semantic facts | names, types, conformance, legality, as Salsa queries | `beskid_queries` |
| lowering | typed program to codegen input, then ISLE rules to CLIF | `beskid_codegen`, `beskid_isle` |
| codegen | CLIF to machine code | Cranelift |
| link | object plus runtime kit to executable or library | `beskid_aot` |
| phase identity | the phase IDs every stage reports progress under | `beskid_pipeline` |

Two crates you will see in stack traces and should know about even though they are not stages: `abfall` is the garbage collector, and `beskid_abi` is the table of symbols and layouts that generated code and the runtime agree on.

## Which command stops where

| Command | Stops after |
| --- | --- |
| `beskid parse`, `beskid tree` | parse |
| `beskid analyze` | semantic facts |
| `beskid clif` | lowering, prints the IR |
| `beskid build` | link |
| `beskid run` | link, then executes the binary in a subprocess |
| `beskid test` | semantic facts, then runs `test` items in-process on the JIT |
| `beskid repl` | JIT, one snippet at a time |

The `dev` command groups the same operations under `beskid dev syntax`, `beskid dev build`, and `beskid dev project`. The root commands are shortcuts and they are the ones the rest of the book uses.

## Semantic facts are shared

`beskid_queries` is a Salsa database. Every semantic question, "what does this name resolve to", "does this type conform to that contract", "is this call legal", is a memoized query keyed on the inputs it read. The CLI asks those queries once per build. The language server asks them on every keystroke and gets cached answers for everything that did not change. Lowering asks them to decide what to emit. There is one semantic authority, and "the editor says it compiles but the build fails" is a version mismatch, never a second analysis with different opinions.

## Legality is scoped to reachability

The semantic gate checks what a target reaches from its entry, not every file under `root`. A helper module nothing imports can be broken without stopping the build of the target that does not import it. The other side of that coin is in chapter 07: a red `Test` target next to a green `App` target is possible, so CI runs both.

The stage contracts are in [build pipeline](/platform-spec/compiler/build-pipeline/), and the CLI's obligations across `build`, `analyze`, and `run` are in the [build, analyze, run contract](/platform-spec/tooling/cli/build-analyze-run-contract/).

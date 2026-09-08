---
title: "Pipeline overview"
description: Resolution, semantic facts, typed code generation, AOT execution, and the separate interactive JIT paths.
tableOfContents: true
---

Mirror of the normative [Build pipeline overview](/docs/standard/compiler/build-pipeline/)—same flow, book voice.

```mermaid
accTitle: Current compilation and execution pipeline
accDescr: Resolution and syntax produce a typed program, CodegenInput drives ISLE emission, and the result goes to AOT commands or the JIT test and REPL paths.
flowchart TB
  resolve[Project resolution]
  assemble[program.assemble]
  parse[Parse and syntax diagnostics]
  mods[Mod host optional]
  semantic[Semantic rules and composition.resolve]
  typed[TypedProgram]
  input[CodegenInput]
  isle[ISLE emission to CodegenArtifact]
  jit[JIT tests and REPL]
  aot[AOT build, run, and link]
  resolve --> assemble --> parse --> mods --> semantic --> typed --> input --> isle
  isle --> jit
  isle --> aot
```

**Text equivalent:** Resolve the project and assemble source roots. Parse and analyze the program, apply approved Mod behavior, and produce `TypedProgram`. Construct `CodegenInput`, emit through ISLE, and create `CodegenArtifact`. `beskid build` and `beskid run` use AOT output. The current test runner and REPL use the JIT engine.

## Crate map

| Stage | Primary crates |
| --- | --- |
| Resolution / graph | `beskid_analysis` (`projects`), `beskid_cli` |
| Parse, syntax, and typed facts | `beskid_analysis`, `beskid_queries` |
| Mod host | `beskid_analysis` (`mod_host`) |
| Semantic rules | `beskid_analysis` (`analysis`) |
| `CodegenInput` and ISLE emission | `beskid_codegen`, `beskid_isle` |
| JIT tests and REPL | `beskid_engine`, `beskid_repl`, `beskid_abi` |
| AOT | `beskid_aot` |
| Phase IDs | `beskid_pipeline` |

## CLI entry

`beskid build`, `beskid run`, `beskid analyze` orchestrate subsets—contract: [Build / analyze / run](/docs/standard/tooling/cli/build-analyze-run-contract/).

## Diagnostics parity

LSP analysis should match CLI phases for the same snapshot ([LSP diagnostics](/docs/standard/tooling/lsp/diagnostics-and-workspace-analysis/)).

## Next

[Front-end](/book/14-from-source-to-runs/front-end/)

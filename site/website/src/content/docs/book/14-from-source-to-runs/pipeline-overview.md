---
title: "Pipeline overview"
description: Resolution, assembly, parse, mods, semantic analysis, lowering, JIT or AOT.
tableOfContents: true
---

Mirror of the normative [Build pipeline overview](/platform-spec/compiler/build-pipeline/)—same flow, book voice.

```mermaid
flowchart TB
  resolve[Project resolution]
  assemble[program.assemble]
  parse[Parse and syntax diagnostics]
  mods[Mod host optional]
  semantic[Semantic rules and composition.resolve]
  hir[HIR resolve and type-check]
  lower[lower_program to CodegenArtifact]
  jit[JIT run_entrypoint]
  aot[AOT build and link]
  resolve --> assemble --> parse --> mods --> semantic --> hir --> lower
  lower --> jit
  lower --> aot
```

## Crate map

| Stage | Primary crates |
| --- | --- |
| Resolution / graph | `beskid_analysis` (`projects`), `beskid_cli` |
| Parse / syntax | `beskid_analysis` (`syntax`, `parser`) |
| Mod host | `beskid_analysis` (`mod_host`) |
| Semantic rules | `beskid_analysis` (`analysis`) |
| Lowering | `beskid_codegen` |
| JIT | `beskid_engine`, `beskid_runtime`, `beskid_abi` |
| AOT | `beskid_aot` |
| Phase IDs | `beskid_pipeline` |

## CLI entry

`beskid build`, `beskid run`, `beskid analyze` orchestrate subsets—contract: [Build / analyze / run](/platform-spec/tooling/cli/build-analyze-run-contract/).

## Diagnostics parity

LSP analysis should match CLI phases for the same snapshot ([LSP diagnostics](/platform-spec/tooling/lsp/diagnostics-and-workspace-analysis/)).

## Next

[Front-end](/book/14-from-source-to-runs/front-end/)

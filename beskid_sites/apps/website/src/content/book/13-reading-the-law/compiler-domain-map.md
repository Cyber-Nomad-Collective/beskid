---
title: "Compiler domain map"
description: Build pipeline, front-end, semantic pipeline, mods, conformance, and implementation map.
tableOfContents: true
---

[Compiler](/platform-spec/compiler/) documents the **reference compiler workspace**—phases, diagnostics parity, and mod host contracts—without redefining language semantics.

Use this domain when the question concerns the reference implementation's processing, diagnostics, or conformance evidence. For the meaning of a source program, return to [language meta](/platform-spec/language-meta/); an implementation detail is not automatically language law.

## Areas worth bookmarking

| Area | Contents |
| --- | --- |
| [Build pipeline](/platform-spec/compiler/build-pipeline/) | Resolution → parse → mods → semantic → lower → JIT/AOT |
| [Front-end](/platform-spec/compiler/front-end/) | Grammar, parser, AST/HIR contracts |
| [Semantic pipeline](/platform-spec/compiler/semantic-pipeline/) | Rules, diagnostic registry |
| [Resolution and projects](/platform-spec/compiler/resolution-and-projects/) | Graph, workspaces, cycles |
| [Compiler mods](/platform-spec/compiler/compiler-mods/) | Mod host bridge, syntax facade, scheduling |
| [Conformance](/platform-spec/compiler/conformance/) | `beskid_tests` policy |
| [Implementation map](/platform-spec/compiler/implementation-map/) | Crate anchors |

## Workspace crates (quick)

From `compiler/Cargo.toml` members most readers touch:

- `beskid_analysis` — parse, resolve, semantic rules, mod host
- `beskid_codegen` — lowering to `CodegenArtifact`
- `beskid_engine` — JIT `run_entrypoint`
- `beskid_aot` — AOT build and link
- `beskid_cli` — commands
- `beskid_pipeline` — shared phase IDs
- `beskid_tests`, `beskid_e2e_tests` — conformance

## Pipeline composition

Rust-only host composition (IoC) is **not** Beskid mod syntax—see [Pipeline composition](/platform-spec/compiler/pipeline-composition/).

## How to follow a compiler question

Begin at the relevant area, open its feature hub, and then follow the requirement links into code only when you need implementation evidence. The [implementation map](/platform-spec/compiler/implementation-map/) is the bridge for that last step; it is not a substitute for the feature's contract.

## Next

[Execution and corelib](/book/13-reading-the-law/execution-and-corelib/)

---
title: REPL command
description: Interactive snippet evaluator backed by a persistent JIT engine session.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

<SpecSection title="Purpose" id="purpose">
`beskid repl` is the only supported production JIT path after phase 1 of the execution split. It evaluates **single expression or statement snippets** with sub-second re-compile latency using a persistent [`beskid_engine::Engine`](.) session. Project manifests, multi-file modules, and workspace graphs are out of scope for v1.
</SpecSection>

<SpecSection title="Normative behavior" id="normative-behavior">
- Snippets are parsed and type-checked through the same analysis front-end as other CLI commands, but **without** `resolve_input` / project graph wiring.
- Each accepted snippet is lowered and JIT-compiled into the session engine; results are formatted like interim `beskid test` entrypoints (`ok` for `unit`, decimal integers for scalars, lowercase hex for pointer-like returns).
- `:quit` ends the session; `:reset` replaces the engine with a fresh instance.
- Pipeline observers **may** emit `jit.emit` / `jit.finalize` phases; AOT phases **must not** appear on this path.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Crate: `compiler/crates/beskid_repl/`
- CLI wiring: `compiler/crates/beskid_cli/src/commands/repl.rs`
- JIT host: `compiler/crates/beskid_engine/`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->

---
title: Native dependency injection
description: Language-native host composition — host, registry, named scopes,
  with activation, inject, startup, and launch.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

Native **dependency injection** is a **language feature**: projects declare named **`host`** types (including reusable library hosts), register services in **`registry`** (global scope), define nested **`scope`** containers with **`init`** / **`dispose`**, activate scopes with **`with`**, use **field `inject`** (including **`T[]`** for multiple implementations), and start the process with a single **`launch`**. The reference compiler **fully resolves** the graph at compile time; backends do not perform runtime service lookup.

## Boundaries

| Plane | Mechanism |
| --- | --- |
| **App composition (this feature)** | `host`, `registry`, `scope`, `init`, `dispose`, `with`, field `inject`, `startup`, `launch` |
| **Rust pipeline composition** | [Pipeline composition](/platform-spec/compiler/pipeline-composition/) — compiler pass/service graph only |
| **Compiler mods (`type: Mod`)** | [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/) — contract `registrations[]`, not app DI |
| **Package dependency graph** | [Resolution and projects](/platform-spec/compiler/resolution-and-projects/) — `CompilePlan` / lockfile, not service lifetimes |

`Mod` projects **must not** declare `host` blocks or alter app composition graphs. Mod analyzers may **query** a frozen composition snapshot exported by the compiler ([Analysis, query, and diagnostics facades](/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/)).

## Corelib hosts

Built-in host bases (for example **`ConsoleHost`**, future **`WebHost`**) live in **corelib**. An app **`host`** may inherit a base (`: ConsoleHost`) to reuse default registry entries and run-loop behavior. Base-host contracts are specified alongside execution and corelib packages as they land.

## Implementation anchors (reference compiler)

Anchors name the modules that own each plane of native DI in the reference compiler. The codegen lowering gate (`RUNTIME_CONTAINER_LOWERING_ENABLED`) is **on** as of v0.3; `launch` and `with` emit real runtime container ABI calls.

- `compiler/crates/beskid_analysis/src/composition/` — host-chain merge, scope tree, `BindingPlan`, `CompositionSnapshot` export
- `compiler/crates/beskid_codegen/src/lowering/composition_policy.rs` — `RUNTIME_CONTAINER_LOWERING_ENABLED` feature gate
- `compiler/crates/beskid_codegen/src/lowering/composition/` — `launch` / `with` lowering to runtime container ABI calls (`launch_statement.rs`, `with_statement.rs`)
- `compiler/crates/beskid_runtime/src/composition/` — `RuntimeContainer` (registration ordering, plural inject, LIFO dispose) and scope-stack management
- `compiler/crates/beskid_runtime/src/builtins/composition.rs` — `extern "C-unwind"` ABI surface (`composition_container_create`, `composition_register`, `composition_bind_plural`, `composition_launch`, `composition_scope_enter`, `composition_scope_leave`, `composition_resolve`, `composition_resolve_plural`, `composition_shutdown`, `composition_container_drop`, `composition_scope_depth`)
- `compiler/crates/beskid_abi/src/symbols.rs` / `compiler/crates/beskid_abi/src/builtins.rs` — stable linker symbols and `BuiltinFnSpec` entries for every `composition_*` builtin
- `compiler/crates/beskid_pipeline` — `composition.resolve` phase id (see [Flow and algorithm](./flow-and-algorithm/))
- `compiler/corelib` — `ConsoleHost`, `WebHost`, shared configuration types

End-to-end verification lives at `compiler/crates/beskid_tests/src/composition/` (`container.rs`, `host_e2e.rs`, `lowering.rs`).

## Articles

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-LMETA-DI-0001` … `D-LMETA-DI-0010`); use the reader **ADRs** tab for detail. Rust compiler-host IoC remains **[D-INC-0002](/platform-spec/community/project-inception/adr/0002-compile-time-ioc/)** (separate plane).

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)

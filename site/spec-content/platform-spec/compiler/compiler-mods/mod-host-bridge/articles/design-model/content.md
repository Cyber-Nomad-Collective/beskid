---
title: mod host bridge - Design model
description: Rust-side mod host execution, AOT artifact lifecycle, capability
  policy, and typed merge.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-10
---

This article documents the **design model** for the **Mod host bridge**.

## Language alignment

Executes **`Collector` → `Generator` → semantic gate → `Analyzer` → `Rewriter`** for `Mod` packages discovered from the dependency graph. Scope narrowing is owned by **`Collector`** contracts, not manifest attach fields.

## Persistent entities

- **Compilation instance** — active host compilation under transformation.
- **Mod artifact** — AOT-compiled output for a `Mod` package, cached under object/package store paths.
- **Syntax snapshot** — immutable tree with stable node identities for incremental keys.
- **Capability tokens** — host-granted permissions for diagnostics, typed emit, rewrite, and optional source/semantic reads.

## Boundaries

- Mod SDK facades never bypass the host bridge for effects.
- Compiler composition / IoC remains Rust-owned (**[Pipeline composition](/platform-spec/compiler/pipeline-composition/)**).
- Mod execution is **AOT-only**; no compile-time JIT path is normative.

## Mod artifact lifecycle

1. **Discovery** — Resolve all transitive `type: Mod` dependencies from host `CompilePlan`.
2. **Build** — On first detection or hash change, compile mod package AOT and store artifact.
3. **Registry fetch** — Package manager fetched mods: build once, cache artifact by lock hash + target triple.
4. **Workspace edit** — Local `Mod` projects rebuild on source/config hash change (eager incremental check).
5. **Load** — Host loads artifacts before `mod.collect` for the active compilation.

CLI commands **`beskid mod rebuild`** (clean + build mod artifacts) and **`beskid mod clean`** manage object-store mod outputs. **`beskid mod generate`** is **not** normative—typed generation and optional disk materialization are scheduled by the host during compilation (see **Target-driven materialization** below).

## Target-driven materialization

Generation and optional on-disk writes run when **observed Collector targets** change (new target, removed target, or content-hash delta)—not via a standalone CLI generate step.

| Step | Behavior |
| --- | --- |
| **`mod.collect`** | Mod returns a `CollectTargetSet` with stable target ids (file paths, symbol ids, attribute roots). |
| **Host fingerprint** | Computes **`capture_fingerprint`** per registration (see **[Incremental scheduling and determinism](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/design-model/)**). |
| **On miss** | Run **`mod.generate`**, merge typed items into the host program, and when the mod declares **`generatedOutputs`** in its manifest, write files through the generic layout writer (`generate.layout.json` + root). |
| **On hit** | Skip generator execution and disk write for that registration. |

The generic output writer is **mod-agnostic**—it maps typed emit results to on-disk paths from manifest layout metadata; generation logic stays in Beskid mod contracts.

**`artifactPolicy`** on the mod manifest (`reuse`, `rebuild`, `clean_rebuild`) governs when fetched mod artifacts are invalidated before collect/generate; hosts **must** honor it during **`beskid mod rebuild`** and host build entrypoints.

## Contract discovery

Mod packages **must** export contract implementations as **public Beskid types** implementing SDK `contract` interfaces. The host **must not** rely on manifest attach lists or language-level meta items for registration.

At **`mod.load`**, for each resolved `Mod` package the host:

1. Opens the AOT artifact for the active target triple (**[AOT artifact contract](./aot-artifact-contract/)**).
2. Parses `mod.descriptor.json` (authoritative when present) and validates the embedded **`registrations`** array.
3. Schedules one host entry per **`(contractId, typeId, entrySymbol)`** tuple.

| Field | Role |
| --- | --- |
| `contractId` | Stable SDK contract identity (`Beskid.Compiler.Collect.Collector`, etc.). |
| `typeId` | Public type in the mod assembly implementing the contract. |
| `entrySymbol` | Native export used to invoke the contract at the mod boundary. |

Conflicting registrations or bootstrap failures **must** emit **E1821–E1835** / **E1851–E1870** and abort scheduling before `mod.collect`. Scope narrowing remains in **`Collector`** implementations, not manifest metadata.

## Capability matrix (normative vocabulary)

Manifest `project.mod.capabilities` lists entries from this closed set. Defaults when omitted: **`diagnostics`** only.

| Capability | Grants |
| --- | --- |
| `diagnostics` | Emit compiler-native diagnostics. |
| `read_project_sources` | Read UTF-8 from resolved module roots of the host compilation. |
| `emit_syntax` | Apply typed AST contributions from `Generator`. |
| `query_semantic_snapshot` | Read semantic snapshot after the diagnostics gate. |
| `rewrite_syntax` | Apply typed `Rewriter` replacements. |
| `extern_ffi` | Opt-in FFI bridge per **[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)**. |

## Pipeline observation

Host boundaries **must** emit `beskid_pipeline` phase ids: `mod.load`, `mod.collect`, `mod.generate`, `syntax.generation`, `semantic.snapshot`, `mod.analyze`, `mod.rewrite`, `lower.ready`. See **[Compiler Mods / phase ids](/platform-spec/compiler/compiler-mods/#mod-projects)**.

## Anchored code paths

- `compiler/crates/beskid_analysis/src/mod_host/` — collection, typed merge, contract dispatch, analyzer / rewrite orchestration.
- `compiler/crates/beskid_analysis/src/mod_host/generate_output.rs` — mod-agnostic generic layout writer for **`generatedOutputs`** disk materialization.
- `compiler/crates/beskid_analysis/src/mod_host/invoker.rs` — **`ContractInvoker`** trait + Stub / Scripted invokers used by host pipeline and tests.
- `compiler/crates/beskid_analysis/src/mod_host/validate.rs` — pre-`mod.collect` registration validation pass that emits **E1828**, **E1829**, **E1851**, **E1852**, **E1853**, **E1854**, **E1855**.
- `compiler/crates/beskid_analysis/src/mod_host/diagnostics.rs` — structured **`ModHostIssue`** / **`ModHostDiagnostics`** carriers.
- `compiler/crates/beskid_analysis/src/services/front_end.rs` — front-end session hook for `run_through_generate` / `run_analyze_rewrite`.
- `compiler/crates/beskid_pipeline/` — phase ids and observers.
- `compiler/crates/beskid_codegen/src/services.rs` — lowering after consistent merged program.

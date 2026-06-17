---
title: Mod host bridge
description: Reference compiler-owned execution, capability policy, and
  communication with compile-time Beskid modules.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-01
---

This feature hub defines Rust-side mod-host execution: `Mod` project registration, contract discovery, AOT artifact lifecycle, compilation-event orchestration, and capability policy.

## Language alignment
Implements language-meta compiler-mod contracts (`Collector`, `Generator`, `Analyzer`, `Rewriter`, `AttributeGenerator`) for manifest-driven `Mod` orchestration.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/mod_host/` — mod discovery, registration validation, contract dispatch through `ContractInvoker`, typed merge / reparse, analyze / rewrite orchestration.
- `compiler/crates/beskid_analysis/src/mod_host/invoker.rs` — **`ContractInvoker`** trait with **`StubContractInvoker`** / **`ScriptedContractInvoker`** for host bring-up and tests.
- `compiler/crates/beskid_analysis/src/mod_host/validate.rs` — pre-`mod.collect` cross-artifact validation that short-circuits scheduling on **E1828**, **E1829**, **E1851**, **E1852**, **E1853**, **E1854**, **E1855**.
- `compiler/crates/beskid_codegen/src/services.rs` — lowering boundaries after typed mod contributions.
- `compiler/crates/beskid_engine/tests/mod_host.rs` — engine integration test driving the full pipeline through `Engine::compile_artifact`.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0010` … `D-COMP-MODS-0012`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Mod host bridge - AOT artifact contract](./articles/aot-artifact-contract/)
- [mod host bridge - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [mod host bridge - Design model](./articles/design-model/)
- [mod host bridge - Examples](./articles/examples/)
- [mod host bridge - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [mod host bridge - Flow and algorithm](./articles/flow-and-algorithm/)
- [mod host bridge - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->

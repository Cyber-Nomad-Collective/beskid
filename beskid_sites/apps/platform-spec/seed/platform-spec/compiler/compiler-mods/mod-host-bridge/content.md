import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

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

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0010` … `D-COMP-MODS-0012`); use the reader **ADRs** tab for expandable detail.


- [Design model](./design-model/)
- [AOT artifact contract](./aot-artifact-contract/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)

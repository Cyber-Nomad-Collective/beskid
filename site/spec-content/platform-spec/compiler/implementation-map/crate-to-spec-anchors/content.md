---
title: Crate-to-spec anchors
description: Formal mapping from compiler crates to platform-spec areas and feature leaves.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
This feature explains how maintainers trace each normative statement to a concrete crate boundary. It is organized into newcomer-friendly articles that move from model, to flow, to contracts, then practical verification and debugging guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `beskid_analysis` -> parser/resolution/semantic leaves
- `beskid_codegen` -> lowering contract leaves
- `beskid_abi` and `beskid_runtime` -> execution ABI/runtime leaves
- `beskid_engine` -> JIT execution of CodegenArtifact
- `beskid_aot` -> AOT compilation and object emission
- `beskid_pipeline` -> stable pipeline phase ordering and composition
- `beskid_graph` -> project graph model
- `beskid_queries` -> Salsa incremental query engine
- `beskid_cli` -> command surface and build/run orchestration
- `beskid_lsp` -> language server and diagnostics parity
- `beskid_pckg` -> package registry client
- `beskid_runtime_bridge` -> arch/OS interop (extern dispatch)
- `beskid_template` -> project scaffolding templates
- `abfall` -> garbage-collector allocator (Sweep, Mark, Compact)
- `beskid_tests` and `beskid_e2e_tests` -> conformance leaves
- `beskid_ast_derive`, `beskid_ast_reflect_gen` -> internal code-generation utilities (no normative spec surface)
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MAP-0001` … `D-COMP-MAP-0003`); use the reader **ADRs** tab for expandable detail.

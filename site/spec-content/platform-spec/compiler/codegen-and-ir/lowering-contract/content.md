---
title: Lowering contract
description: Contract for lowering parsed and analyzed source into backend-ready
  `CodegenArtifact`.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-29
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
This feature explains how source text becomes a backend-ready artifact without changing language semantics late in the pipeline. It is organized into newcomer-friendly articles that move from model, to flow, to contracts, then practical verification and debugging guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `beskid_codegen::lower_source` in `compiler/crates/beskid_codegen`
- `CodegenArtifact` construction in `compiler/crates/beskid_codegen`
- `JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs`
- Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-IR-0007` … `D-COMP-IR-0011`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->

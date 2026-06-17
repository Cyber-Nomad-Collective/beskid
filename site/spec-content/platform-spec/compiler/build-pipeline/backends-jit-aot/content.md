---
title: Backends (JIT and AOT)
description: Contracts for JIT execution and AOT object/link flows that consume
  a shared lowering artifact.
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

This feature hub defines how JIT and AOT diverge after lowering while sharing the same `CodegenArtifact`.

## Implementation anchors
- `compiler/crates/beskid_engine/src/` — JIT execution of `CodegenArtifact` via Cranelift
- `compiler/crates/beskid_aot/src/` — AOT compilation, object emission, and linking
- `compiler/crates/beskid_codegen/src/` — shared `CodegenArtifact` consumed by both backends

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0001` … `D-COMP-BUILD-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Backends (JIT and AOT) - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Backends (JIT and AOT) - Design model](./articles/design-model/)
- [Backends (JIT and AOT) - Examples](./articles/examples/)
- [Backends (JIT and AOT) - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Backends (JIT and AOT) - Flow and algorithm](./articles/flow-and-algorithm/)
- [Backends (JIT and AOT) - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->

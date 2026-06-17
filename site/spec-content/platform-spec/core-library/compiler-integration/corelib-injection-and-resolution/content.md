---
title: Corelib injection and resolution
description: How the compiler discovers, injects, and resolves corelib symbols
  across analysis and build stages.
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
`Corelib injection and resolution` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Corelib integration tests in `compiler/crates/beskid_tests/src/projects/corelib/compile.rs`
- Corelib project helpers in `compiler/crates/beskid_tests/src/projects/corelib/mod.rs`
- Analysis services in `compiler/crates/beskid_analysis/src/services/`
- Resolution pipeline in `compiler/crates/beskid_analysis/src/resolve/mod.rs`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-COMP-0005` … `D-CORE-COMP-0010`); use the reader **ADRs** tab for expandable detail.
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

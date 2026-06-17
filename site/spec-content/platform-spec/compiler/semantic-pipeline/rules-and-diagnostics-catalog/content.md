---
title: Rules and diagnostics catalog
description: Semantic rule execution model and diagnostic-kind catalog contract
  for compiler analysis.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-11
---

## What this feature governs

This feature defines how semantic rules are scheduled and how their findings map to stable diagnostic kinds. The primary implementation roots are `beskid_analysis/src/analysis`, staged rule modules under `analysis/rules/staged`, and services that expose diagnostics to CLI/LSP consumers.

## Core guarantees

1. Semantic checks run on resolved project state and must produce deterministic diagnostic ordering.
2. Diagnostic kind identity is anchored in `analysis/diagnostic_kinds.rs`.
3. Error-severity diagnostics are compilation blockers in diagnostics-enabled paths.
4. CLI and LSP surfaces may differ in rendering but must preserve diagnostic kind and source span identity.

## Documentation diagnostics (snapshot)

Documentation-only findings use stable warning codes **W1610–W1615** and **W1620–W1625** (see **[Diagnostic code registry design model](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/design-model/)**). They are computed in `beskid_analysis::doc::collect_doc_diagnostics` and attached to `DocumentAnalysisSnapshot::doc_diagnostics` so editors can merge them with staged semantic diagnostics without re-running HIR-heavy rules on the hot path.

## Implementation anchors

- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged`
- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`
- `compiler/crates/beskid_analysis/src/services/`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0007` … `D-COMP-SEM-0009`); use the reader **ADRs** tab for expandable detail.
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

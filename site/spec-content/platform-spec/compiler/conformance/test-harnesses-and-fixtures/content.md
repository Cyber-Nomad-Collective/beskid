---
title: Test harnesses and fixtures
description: Conformance and regression fixture contracts across compiler unit,
  integration, and end-to-end test crates.
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
This feature explains how the project proves that implemented behavior remains stable release over release. It is organized into newcomer-friendly articles that move from model, to flow, to contracts, then practical verification and debugging guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_tests/src/analysis` fixture-driven semantic assertions
- `compiler/crates/beskid_tests/src/runtime` runtime behavior checks
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` source-to-runtime outcomes
- `compiler/crates/beskid_tests/src/doc_tests.rs` docs-driven verification
- `compiler/crates/beskid_tests/src/mods` compiler-mod tests (manifest goldens, pipeline ordering, incremental replay, analyzer coverage)
- `compiler/crates/beskid_tests/src/spine` spine parity and diagnostics round-trip tests
- `compiler/crates/beskid_tests/src/lsp` LSP integration tests (completion, hover, references, semantic tokens)
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-CONF-0004` … `D-COMP-CONF-0007`); use the reader **ADRs** tab for expandable detail.

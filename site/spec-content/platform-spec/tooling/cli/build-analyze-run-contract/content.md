---
title: Build, analyze, and run contract
description: Expected CLI behavior and outputs across build, analysis, and
  runtime execution commands.
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
`Build, analyze, and run contract` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- CLI command implementations in `compiler/crates/beskid_cli/src/commands/`
- Analysis pipeline in `compiler/crates/beskid_analysis/src/services/`
- Runtime launch via AOT subprocess in `compiler/crates/beskid_aot/src/run.rs`; JIT REPL in `compiler/crates/beskid_repl/`
- CLI-facing tests in `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs`
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-CLI-0001`** (hub authority), **`0002`** (shared analysis pipeline with LSP)—see **`adr/`** and the **ADRs** tab.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-CLI-0001` … `D-TOOL-CLI-0002`); use the reader **ADRs** tab for expandable detail.
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

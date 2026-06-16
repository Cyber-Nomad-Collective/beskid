---
title: Corelib discovery and packaging
description: Compiler/runtime contracts for locating, embedding, and validating
  the canonical corelib package.
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
This feature explains how compiler and tooling always load the same canonical corelib package identity and files. It is organized into newcomer-friendly articles that move from model, to flow, to contracts, then practical verification and debugging guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Canonical package root `compiler/corelib/beskid_corelib`
- Canonical package identity `corelib` (`Project.proj`), with `beskid_corelib` as the repository directory name
- Corelib path discovery in `compiler/crates/beskid_analysis/src/projects/graph/resolver.rs`
- CLI embedding/install support in `compiler/crates/beskid_cli/build.rs` and `compiler/crates/beskid_cli/src/corelib_runtime.rs`
- Integration checks in `compiler/crates/beskid_tests/src/projects/corelib`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-COMP-0001` … `D-CORE-COMP-0004`); use the reader **ADRs** tab for expandable detail.

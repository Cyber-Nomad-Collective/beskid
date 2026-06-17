---
title: Diagnostic code registry
description: Registry contract for semantic diagnostic code ownership and
  synchronization with compiler sources.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-29
---

## What this feature governs

This feature defines ownership and evolution rules for semantic diagnostic codes in `SemanticIssueKind::code()` and neighboring catalog logic. It keeps diagnostics stable for tooling, docs, and conformance references.

## Core guarantees

1. Diagnostic code-to-meaning mapping is normative in compiler source, not in rendering layers.
2. New semantic issues must use unique, documented codes before release.
3. Registry updates must remain synchronized with platform-spec documentation and verification scripts.
4. Renaming or reusing existing codes requires explicit migration handling for downstream consumers.

## Implementation anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`
- `compiler/crates/beskid_analysis/src/services/`
- `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`
## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0001` … `D-COMP-SEM-0003`); use the reader **ADRs** tab for expandable detail.
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

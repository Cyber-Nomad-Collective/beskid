---
title: Workspace resolution contract
description: Project graph discovery, manifest loading (including Mod projects),
  and workspace inputs for compiler and tooling commands.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-01
---

This feature hub explains how the compiler discovers `Project.proj`, builds a project graph, and hands resolved workspace inputs to compile and dependency commands. **`Mod`** projects are included in the graph like other project kinds; after resolution, the **mod host** registers them for **event-driven** orchestration per **[Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)** and **[Compiler Mods](/platform-spec/compiler/compiler-mods/)**.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/projects/` — project graph discovery and manifest loading
- `compiler/crates/beskid_analysis/src/resolve/` — resolution pipeline and module graph construction
- `compiler/crates/beskid_analysis/src/mod_host/` — Mod project registration after resolution

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0013` … `D-COMP-PROJ-0015`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Workspace resolution contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Workspace resolution contract - Design model](./articles/design-model/)
- [Workspace resolution contract - Examples](./articles/examples/)
- [Workspace resolution contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Workspace resolution contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Workspace resolution contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->

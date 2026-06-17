---
title: Bsol (Beskid Structured Object Language)
description: Normative surface grammar, generic AST, and schema profiles for
  Beskid manifest files.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-07
---

<SpecSection title="What Bsol is" id="what-bsol-is">
**Bsol** (Beskid Structured Object Language) is the shared meta-language for Beskid configuration documents: block-oriented assignment syntax used by **`*.bproj`** project manifests, **`*.bws`** / `workspace.proj` workspace manifests, and **`runtime_manifest.bsol`**.

Bsol specifies **lexical rules**, **generic surface grammar**, the **reference AST**, and **schema profiles**. Manifest **semantics** (required keys, project kinds, Mod blocks, link metadata, runtime ABI tables) remain in sibling contract features and profile-specific lowering crates.
</SpecSection>

<SpecSection title="Authority split" id="authority-split">
| Layer | Owner | Artifact |
| --- | --- | --- |
| Surface syntax + generic AST | **`beskid_bsol` crate** | `src/bsol.pest`, `src/ast.rs`, `parse_bsol_document` |
| Schema profiles | **`beskid_bsol` embedded profiles** | `schemas/project.v1.bsol`, `workspace.v1.bsol`, `runtime.v1.bsol` |
| Project / workspace semantics | Project / workspace contract features | `beskid_analysis::projects::model`, `validator` |
| Runtime ABI semantics | Runtime manifest profile + `beskid_manifest` | `runtime_manifest.bsol` → `ManifestRoot` |
| Diagnostics | Compiler resolution feature | E1801–E1899 meta-contract band after lowering |
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_bsol/` — grammar, generic AST, schema loader, `validate`
- `compiler/crates/beskid_analysis/src/projects/parser.rs` — lowers `project.v1` / `workspace.v1` to typed manifests
- `compiler/crates/beskid_manifest/` — loads `runtime_manifest.bsol` via `runtime.v1`
- `compiler/runtime_manifest.bsol` — authoritative runtime ABI manifest
- Unit tests: `beskid_bsol`, `beskid_analysis::projects::parser`, `beskid_manifest`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Design model](./articles/design-model/)
- [Runtime manifest profile](./articles/runtime-manifest-profile/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->

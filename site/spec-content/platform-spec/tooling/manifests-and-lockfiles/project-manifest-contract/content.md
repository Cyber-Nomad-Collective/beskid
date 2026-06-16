---
title: Project manifest contract
description: Project manifest schema including Mod project type, resolution
  inputs, and mod orchestration wiring.
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

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Project manifest contract` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Bsol parse + AST: `compiler/crates/beskid_analysis/src/bsol.pest`, `projects/bsol/`
- Manifest loading in `compiler/crates/beskid_analysis/src/services/`
- CLI project graph setup in `compiler/crates/beskid_cli/src/commands/`
- Workspace resolution in `compiler/crates/beskid_analysis/src/resolve/items.rs`
- Contract tests in `compiler/crates/beskid_tests/src/projects/corelib/mod.rs`
</SpecSection>

<SpecSection title="Mod project type (`Mod`)" id="meta-project-type">
A manifest may declare **`type: Mod`**. A **`Mod`** project is a compiler-mod package: discovered from the dependency graph, compiled AOT, and executed through SDK contracts during host compilation. See **[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** and **[Compiler Mods](/platform-spec/compiler/compiler-mods/)**.

Normative **`project.mod`** keys (`maxGeneratorRounds`, `capabilities`, optional `artifactPolicy`) are specified in **[design model](./design-model/)**; **[examples](./examples/)** show illustrative manifests.

**v0.3 FFI:** optional **`project.link`** for foreign libraries is specified in **[project link libraries](./project-link-libraries/)** and populated via **[foreign library import](/platform-spec/tooling/foreign-library-import/)**.
</SpecSection>

<SpecSection title="Template project type (`Template`)" id="template-project-type">
A manifest may declare **`type: Template`** for template authoring packages. Consumer-facing scaffold contracts live under **[Project scaffolding](/platform-spec/tooling/project-scaffolding/)**. Instantiated **host** projects from templates follow normal `Host` rules; **corelib** is always implicit (no opt-out manifest flag).
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-MAN-0001`** (hub authority), **`0002`** (Mod and Template project types), **`D-TOOL-MAN-0006`** (explicit use, no prelude; supersedes prelude ADRs under compiler and core-library)—see **`adr/`** and the **ADRs** tab.
</SpecSection>

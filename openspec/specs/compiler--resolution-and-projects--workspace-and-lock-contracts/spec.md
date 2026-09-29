<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Workspace and lock contracts Specification

## Purpose

Compiler workspace graph, lock materialization, and resolution diagnostics (schema defers to tooling).

## Requirements

### Requirement: Graph-verified portable lock authority
The compiler SHALL treat each v2 `project`/`manifest`/`source_root` triple as a portable description, not filesystem authority. It SHALL resolve the triple against its source-specific base, canonicalize existing paths, and compare the full dependency identity with the current `CompilePlan` before using locked roots. It SHALL reject copied same-name locks with different manifests, missing declared path dependencies, and symlink escapes. A `corelib` source SHALL be minted only from a dependency actually resolved beneath the verified canonical installed Corelib workspace root; neither a lock claim nor a similarly named directory SHALL grant Corelib provenance. Invalid ownership or graph identity SHALL fail without granting service-code authority.

#### Scenario: Verified Corelib moves between machines
- **GIVEN** the same v2 lock and two installations whose Corelib roots differ but are each verified
- **WHEN** the compiler resolves the same manifest graph on each machine
- **THEN** the `corelib` anchor resolves to the verified local installation and preserves the graph's logical identity

#### Scenario: Forged or copied lock
- **GIVEN** a lock copied from another same-name project, a swapped manifest, or an asserted Corelib source not present in the verified graph
- **WHEN** the compiler validates it against the current `CompilePlan`
- **THEN** it rejects the mismatch before replay, copying, or compilation

### Requirement: Stable and contained dependency materialization
The compiler SHALL derive a dependency's materialized directory name from a canonical logical tuple of dependency name, source kind, and normalized portable source identity. It SHALL encode the three UTF-8 fields in that order, each prefixed by its byte length as an unsigned 32-bit big-endian integer; lengths beyond that range SHALL fail. It SHALL SHA-256 hash the concatenated frames and use the lowercase hexadecimal encoding of the first 16 digest bytes as the stable 128-bit suffix. Machine paths and process- or platform-dependent hashes SHALL not enter the identity. Registry source identity SHALL additionally include registry alias, package name, resolved version, and artifact digest. The compiler SHALL reject duplicate destinations in one graph before copying. It SHALL use materialized roots only after canonical containment beneath its `obj/beskid/deps/src` directory; a symlink SHALL not turn a relative hint into an outside destination or source.

#### Scenario: Stable materialization after relocation
- **GIVEN** equivalent graphs in two checkout locations or on different supported hosts
- **WHEN** the compiler prepares their dependencies
- **THEN** it derives the same logical materialization directory names without hashing machine-local paths

#### Scenario: Materialization hash test vector
- **GIVEN** dependency name `alpha`, source kind `path`, and normalized portable source identity `libs/alpha`
- **WHEN** the compiler hashes the three length-prefixed UTF-8 frames (`00000005616c70686100000004706174680000000a6c6962732f616c706861` in hex)
- **THEN** the 128-bit lowercase hexadecimal suffix is `60e1eb5f56a307ee659d04846b6f78bf`

#### Scenario: Duplicate or escaping destination
- **GIVEN** two entries claiming one materialized destination or a symlink resolving outside the compiler-owned dependency directory
- **WHEN** preparation validates their destinations
- **THEN** it fails before copying or replaying content outside that directory

### Requirement: Pinned registry artifacts
When a valid v2 lock exists, ordinary and strict resolution SHALL select its exact pinned registry version and verify the downloaded archive's SHA-256 against `artifact_digest` before extraction. An unavailable pinned version or a digest mismatch SHALL fail without selecting a newer version or extracting the artifact. `beskid update` MAY deliberately select a newer version and SHALL write its new version and digest. The compiler SHALL stream each compressed registry archive through auto-cleaned scratch storage while hashing, and SHALL reject an archive larger than 64 MiB (67,108,864 bytes) before extraction or project preparation output, regardless of pin or unresolved-warning policy. The compiler SHALL fully validate and stage an archive before changing its materialized package directory, SHALL reject conflicting or unsafe ZIP entries, and SHALL enforce both a 512 MiB (536,870,912 byte) per-entry and 1 GiB (1,073,741,824 byte) total uncompressed output limit during extraction. Digest-derived registry materialization directories SHALL be immutable: a newly staged package MAY be renamed into an absent destination, but an existing destination SHALL be reused only after byte-for-byte and path/type-for-path validation against the staged package, without mutation; mismatches SHALL fail closed. A rejected archive SHALL leave the prior materialized package unchanged and remove its scratch data. Path dependencies SHALL remain live sources: their contents MAY change without a lock change, while their manifest-derived identity and relative location remain checked.

The compiler SHALL treat exact duplicate raw ZIP names and Unicode-normalized, full-case-folded aliases for the same ZIP path as conflicts on every supported host, regardless of that host's case sensitivity. It SHALL reject ZIP path components that are non-portable on Windows, including reserved device names and trailing dots or spaces. Directory entries SHALL contain no payload and SHALL pass integrity validation rather than being skipped during full-archive checks. Before building path-prefix indexes or writing output, it SHALL reject archives with more than 10,000 raw central-directory entries (counting duplicate names), an entry name longer than 4,096 UTF-8 bytes, or more than 256 path components in one name. ZIP64 archives SHALL be rejected in v0.5, including ZIP64 entry metadata rather than only ZIP64 end-of-directory markers. Multidisk metadata SHALL be rejected both at the end-of-directory record and in each central-directory entry. The compiler SHALL require one unambiguous end-of-central-directory record anchored at the archive end, with the declared central-directory range immediately preceding that record. It SHALL walk the entire declared central-directory range, count its raw file records before ZIP-library name coalescing, and require the walked count and consumed range to match the record's declarations; ambiguous, truncated, or forged count/range metadata SHALL fail closed. The cumulative UTF-8 bytes retained for planned path-prefix keys SHALL not exceed 64 MiB (67,108,864 bytes). These preflight budgets SHALL apply independently of the compressed and uncompressed output limits.

The registry dependency's `source_root` SHALL be derived from the ZIP's exact top-level path spelling, not from host filesystem case-insensitive lookup: a literal directory `src` selects `src`, otherwise a literal `Src` selects `Src`, and otherwise the package root selects `.`. Preflight and post-extraction derivation SHALL agree so the same pinned archive produces identical lock bytes across supported hosts.

#### Scenario: Newer registry version exists
- **GIVEN** a valid v2 registry pin and a newer available version
- **WHEN** ordinary or strict resolution prepares the dependency
- **THEN** it requests the exact pinned version and retains its digest identity

#### Scenario: Pinned artifact is unavailable or changed
- **GIVEN** a pinned version is missing or its downloaded bytes have another SHA-256 digest
- **WHEN** the compiler prepares the dependency
- **THEN** it fails before extraction and does not fall back to another version

#### Scenario: Registry artifact exceeds the compressed-size limit
- **GIVEN** a registry response whose compressed archive exceeds 67,108,864 bytes
- **WHEN** the compiler prepares it, with or without a lock pin
- **THEN** it rejects the archive before extraction or project preparation output and removes its scratch data

#### Scenario: Registry archive conflicts or expands beyond the output budget
- **GIVEN** a registry ZIP with conflicting entry paths, a corrupt late entry, or uncompressed output above either limit
- **WHEN** the compiler prepares the dependency
- **THEN** it rejects the archive without changing the prior materialized package or Project.lock and removes staged output

#### Scenario: Case-aliased paths or directory payload
- **GIVEN** a registry ZIP with Unicode-normalized full-case-fold aliases for one materialized path, a non-portable Windows path component, or a directory entry containing payload or failing integrity validation
- **WHEN** the compiler prepares the dependency on any supported host
- **THEN** it rejects the archive before publishing a package, independent of host case sensitivity

#### Scenario: Exact duplicate ZIP names are hidden by the parser
- **GIVEN** a registry ZIP with two raw central-directory entries whose names are byte-for-byte identical
- **WHEN** the compiler preflights the archive
- **THEN** it rejects the archive before the ZIP library can coalesce those entries by name

#### Scenario: Tiny ZIP with excessive path-index work
- **GIVEN** a registry ZIP below the compressed and uncompressed byte limits but with too many raw entries (including duplicate names), a ZIP64 entry-count marker, an overlong or overdeep entry path, or planned path-prefix keys beyond the cumulative budget
- **WHEN** the compiler preflights its entries
- **THEN** it rejects the archive before allocating an unbounded path index or changing the prior package or Project.lock

#### Scenario: Ambiguous or forged ZIP directory count
- **GIVEN** a registry ZIP with an alternate end-of-central-directory record in its comment, or a declared central-directory count or range that differs from its raw records
- **WHEN** the compiler preflights the archive
- **THEN** it rejects the archive before extraction or changing Project.lock, even if a ZIP library would accept a different directory interpretation

#### Scenario: Entry-level ZIP64 or multidisk metadata
- **GIVEN** a registry ZIP with an ordinary end-of-directory record but a ZIP64 entry field or a nonzero central-directory entry disk number
- **WHEN** the compiler preflights the archive
- **THEN** it rejects the archive before extraction or changing Project.lock, regardless of whether a ZIP library accepts the entry

#### Scenario: Registry source directory uses another case
- **GIVEN** a pinned registry ZIP with a top-level directory spelled `SRC` rather than literal `src` or `Src`
- **WHEN** Linux, macOS, or Windows prepares the dependency
- **THEN** each host records `source_root=.` and neither preflight nor lock generation infers a different spelling from its filesystem

#### Scenario: Existing materialization differs from the pinned artifact
- **GIVEN** a valid pinned archive and an existing digest-derived package directory with changed bytes, extra paths, or unsafe file types
- **WHEN** the compiler prepares the dependency
- **THEN** it reports the tampered materialization without overwriting or deleting that directory

### Requirement: Checked lock replay
LSP and other replay consumers SHALL use a v2 materialized root only after lock ownership, full graph identity, and canonical containment checks. If a materialized directory is absent, they SHALL use current resolved source roots rather than claim a cache hit. The project explorer SHALL display resolved current paths rather than raw lock anchor tokens. A rejected replay SHALL not authorize an outside root or Corelib service source.

#### Scenario: Valid prepared workspace
- **GIVEN** a v2 lock matching the current graph and a contained materialized directory
- **WHEN** LSP replays its dependency roots
- **THEN** it uses the checked materialized root

#### Scenario: Replay hint is absent or unsafe
- **GIVEN** a missing materialized directory, copied lock, or symlink escape
- **WHEN** LSP considers replay
- **THEN** it uses the current resolved roots where valid, or reports the graph error, without treating the hint as a cache hit

### Requirement: Feature hub authority: Decision [D-COMP-PROJ-0010]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-C9A560B9D354`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `28884faf2049b6a0c208bc82a95653c2aff3b4ffc7845bc72d6db71470e0b04b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-PROJ-0011]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-496EBEF9B4BD`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `9e97c3006317a48fd066a9403669309d715c19fd88e101eb245dca2139d0e5c4`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Lockfile pins drive resolution: Decision [D-COMP-PROJ-0012]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Workspace resolution **must** honor lockfile pins from `beskid_analysis::resolve` before applying CLI overrides.

**Stable ID:** `BSP-REQ-3FF390873D74`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0003-lockfile-pins-resolution/content.md`  
**Source SHA-256:** `61fa3fcf096c5f6b3e1f41219cea7c72e243d72ef38e16542ef6dafe07fdfff1`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Workspace and lock contracts

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/content.md`  
**SHA-256:** `dbb883f6dcc82deafe010967f1703b76f4f6744dfdd45ad9f76b88d76e1c124e`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="Authority split" id="authority-split">
**Tooling** owns **`Workspace.proj` / lockfile** schema, update commands, and author-facing reserved-key tables. **This feature** owns how the compiler **materializes** the dependency graph from locks, **rejects** inconsistent workspace layouts, and **diagnoses** resolution failures during analysis and locked builds.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` — project and dependency resolution
- `compiler/crates/beskid_cli/src/commands/` — lock policy flags and update entrypoints
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` and `layout.rs` — lock-sensitive workspace fixtures
- `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs` — workspace pipeline tests
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0010` … `D-COMP-PROJ-0012`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Workspace and lock contracts - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Workspace and lock contracts - Design model](./articles/design-model/)
- [Workspace and lock contracts - Examples](./articles/examples/)
- [Workspace and lock contracts - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Workspace and lock contracts - Flow and algorithm](./articles/flow-and-algorithm/)
- [Workspace and lock contracts - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `28884faf2049b6a0c208bc82a95653c2aff3b4ffc7845bc72d6db71470e0b04b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Sibling articles under this feature previously restated requirements in inconsistent forms.

## Decision

This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

## Consequences

Contract changes start on the hub or in linked ADRs, then propagate to articles and implementation anchors.

## Verification anchors

- `site/website/src/content/docs/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `9e97c3006317a48fd066a9403669309d715c19fd88e101eb245dca2139d0e5c4`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Implementation crates accumulated informal notes that diverged from published contracts.

## Decision

Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

## Consequences

Engineers file spec/ADR updates when behavior changes; crate comments are non-authoritative for conformance arguments.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs`
``````

</details>

### Source Record: Lockfile pins drive resolution

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0003-lockfile-pins-resolution/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0003-lockfile-pins-resolution/content.md`  
**SHA-256:** `61fa3fcf096c5f6b3e1f41219cea7c72e243d72ef38e16542ef6dafe07fdfff1`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Floating registry versions broke reproducible compiles.

## Decision

Workspace resolution **must** honor lockfile pins from `beskid_analysis::resolve` before applying CLI overrides.

## Consequences

Lock update commands are explicit; silent refresh is forbidden under `--locked`.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`.
``````

</details>

### Source Record: Workspace and lock contracts - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `63d5d030ae774ace38275d7d4611e553a7a4dd74c54c75706597f9f69eb30c30`

<details>
<summary>Migrated source text</summary>

``````markdown
## Compiler contracts

- **Deterministic graph** — Given the same lock snapshot and workspace layout, resolution produces the same member DAG.
- **Layout invariants** — Folder layout under workspace members must match what lock materialization expects; violations fail before semantic analysis.
- **No silent lock ignore** — When `--locked` policy is active, missing or stale locks are errors, not warnings-only, unless tooling explicitly defines a warning mode for that command.

## Edge cases (resolution)

- **Stale lock vs registry** — Pin resolution failures surface at materialize time with stable diagnostics.
- **Partial member checkout** — Missing member directories fail graph build with layout-specific codes.
- **Cross-feature manifest errors** — Invalid `Project.proj` nodes still fail in the project-manifest resolution path first.

Workspace key forbiddances and reserved names are specified in **[tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/design-model/)** and are not duplicated here.

## Code anchors

- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`
- `compiler/crates/beskid_cli/src/commands/`
``````

</details>

### Source Record: Workspace and lock contracts - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/design-model/content.md`  
**SHA-256:** `bd4527f3bf3480fdae023e045826ecfa5927a57722d8795ef51f22ce76a64cad`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution model (compiler)

| Entity | Role |
| --- | --- |
| Workspace root | Anchor for member `Project.proj` discovery |
| Lock snapshot | Pinned dependency versions consumed when building the graph |
| Materialized package root | On-disk layout the resolver uses after lock apply |

The compiler **must** treat lock-backed roots as authoritative for reproducible locked graphs. Ad-hoc workspace toggles that alter Mod policy without a spec bump are rejected at parse time in tooling; the compiler enforces the resulting graph only.

## Schema authority

Reserved and forbidden **`Workspace.proj`** keys, `defaultMember`, and lock update semantics are defined in **[tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/design-model/)**. This article does not duplicate those tables.

## Code anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`
``````

</details>

### Source Record: Workspace and lock contracts - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/examples/content.md`  
**SHA-256:** `23d6b0ec990477e187a3d1fa72e687469c5fd05a4476aaa193ef4fd76ec08e73`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **workspace and lock contracts** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` covers lock-sensitive workspace builds.
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` validates workspace folder invariants.
- `compiler/crates/beskid_cli/src/commands/` is the public entrypoint for lock policy flags.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Workspace and lock contracts - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `a8c8502db9229486391887b91bcae54c7aa0e0630cadc61fed817888bd0d8f92`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **workspace and lock contracts** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` covers lock-sensitive workspace builds.
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` validates workspace folder invariants.
- `compiler/crates/beskid_cli/src/commands/` is the public entrypoint for lock policy flags.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Workspace and lock contracts - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/flow-and-algorithm/content.md`  
**SHA-256:** `51dc50eb6420e087177974b3d1583ac9df9ed7a4f825f7dca9065162c8f4085c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution flow

1. **Locate** workspace root and member projects.
2. **Load** lock snapshot (or fail if policy requires a lock and none is present).
3. **Materialize** dependency roots from lock pins into the resolver cache layout.
4. **Build** the combined workspace/project graph (see [project manifest contract / flow](/platform-spec/compiler/resolution-and-projects/project-manifest-contract/flow-and-algorithm/)).
5. Proceed to analysis only when graph and layout invariants pass.

CLI lock **update** and author workflows are described under **[tooling / flow and algorithm](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/flow-and-algorithm/)**.

## Code anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs`
``````

</details>

### Source Record: Workspace and lock contracts - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/verification-and-traceability/content.md`  
**SHA-256:** `ecb047a348e486481d1eb494e18b8f0f32161b15e25875099c5126be1a27eb45`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **workspace and lock contracts** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` covers lock-sensitive workspace builds.
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` validates workspace folder invariants.
- `compiler/crates/beskid_cli/src/commands/` is the public entrypoint for lock policy flags.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

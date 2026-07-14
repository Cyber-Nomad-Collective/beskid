<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Design model Specification

## Purpose

GraphSpec IR, GraphKind, GraphPayload, and revision fingerprints.

## Requirements

### Requirement: Design model conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-C1ADA8EE28B6`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/graph-visualization/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/graph-visualization/design-model/content.md`  
**SHA-256:** `4f43ed3efc796dd88ed5c09fc0d991a19dfa47ea2f1d6ba712e5f84bb57b0e4a`

<details>
<summary>Migrated source text</summary>

``````markdown
## GraphSpec IR

Domain graphs (`ProjectGraph`, `ModuleGraph`, `RegistrationDag`) remain in `beskid_analysis` for correctness. Presentation flows through a domain-agnostic intermediate representation:

| Field | Meaning |
| --- | --- |
| `kind` | `GraphKind` discriminator |
| `nodes` | Stable id, label, shape, style class, optional URI metadata |
| `edges` | Directed links with optional labels |
| `subgraphs` | Workspace members, module paths, DI scopes |
| `warnings` | Cycles, unresolved deps, empty host |

## GraphDocument

| Field | Meaning |
| --- | --- |
| `spec` | Populated `GraphSpec` |
| `mermaid` | Rendered flowchart string from `mermaid-builder` |
| `revision` | Fingerprint for client cache invalidation |

## Salsa memoization

`beskid_queries::graph_mermaid` is the single cache host. Invalidation keys:

| Kind | Inputs |
| --- | --- |
| `projectDeps` / `workspace` | `ProjectSession`, `ManifestGenerationId` |
| `moduleTree` / `importClosure` | `FileText`, `unit_imports`, assembly fingerprint |
| `hostComposition` | Entry text, syntax generation, composition snapshot |

## Presentation policy

- **Mermaid flowchart** is the only supported output format.
- CLI renders via `graphs-tui`; VS Code renders via bundled `mermaid.min.js`.
- Internal `daggy` graphs are never serialized directly to tooling.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>

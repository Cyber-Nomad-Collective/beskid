---
title: Design model
description: GraphSpec IR, GraphKind, GraphPayload, and revision fingerprints.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-30
---

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

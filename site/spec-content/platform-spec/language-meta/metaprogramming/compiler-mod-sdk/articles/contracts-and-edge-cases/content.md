---
title: Compiler Mod SDK - Contracts and edge cases
description: Normative contracts, edge cases, and invariants for the Beskid
  Compiler Mod SDK.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Hard requirements

- **Artifact-driven discovery** — No manifest registration; discovery is entirely artifact-driven.
- **Fail closed** — Missing required contracts or conflicts must fail before `mod.collect` runs.
- **No runtime reflection** — No runtime reflection over arbitrary Beskid objects.
- **No mutation of Rust graphs** — Mod code cannot mutate Rust compiler composition graphs.

## Diagnostic band E18xx

| Code | Condition |
| --- | --- |
| **E1829** | Mod contract conflict |
| **E1851–E1870** | Mod scheduling and execution errors |
| **E1880** | Query bounds exceeded |
| **E1881** | Query node span unavailable |
| **E1883** | Query pipeline conflict |
| **E1884** | Query pipeline stale generation |

## Edge cases

- **Missing AOT artifact** — If the artifact for the target triple is missing, the mod is skipped or errors depending on host policy.
- **Generator round limit** — `maxGeneratorRounds` bounds the generate-reparse loop to prevent infinite generation.
- **Stale generation** — Mods referencing `NodeRef` from a previous syntax generation emit **E1884**.
- **Query pipeline conflict** — Concurrent mod queries modifying the same nodes emit **E1883**.

## Invariants

- Mods must not run before macro expansion completes on the same compilation unit.
- Generated code must pass the same structural checks as authored code.
- Rewriter replacements must be valid typed AST nodes.

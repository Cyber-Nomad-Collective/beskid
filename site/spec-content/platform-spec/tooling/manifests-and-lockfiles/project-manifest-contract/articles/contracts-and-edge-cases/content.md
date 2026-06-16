---
title: Contracts and edge cases
description: Strict guarantees and failure modes for Mod project manifests.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

## Contracts

- **`Mod` must be explicit** — Compiler-mod contracts (`Collector`, `Generator`, `Analyzer`, `Rewriter`, `AttributeGenerator`) are valid only in `type: Mod` projects.
- **No host targets on Mod projects** — `Mod` manifests must not declare App/Lib/Test `target` blocks.
- **Transitive discovery** — Host compilations auto-load all transitive `Mod` dependencies from the resolved graph.
- **Scope via Collector** — Target narrowing is declared by `Collector` contracts, not manifest attach metadata.
- **AOT-only execution** — Mod packages compile to AOT artifacts; no compile-time JIT path is normative.

## Edge cases

- **Invalid `project.mod` keys** — Unknown keys error with stable codes (**E1801–E1810**).
- **Capability denial** — Effects without granted capability fail with **E1821–E1835** diagnostics.
- **Generator round exhaustion** — Exceeding `maxGeneratorRounds` is a hard error, not a silent partial program.
- **Conflicting typed contributions** — Merge failures use **E1836–E1850** and leave syntax unchanged.

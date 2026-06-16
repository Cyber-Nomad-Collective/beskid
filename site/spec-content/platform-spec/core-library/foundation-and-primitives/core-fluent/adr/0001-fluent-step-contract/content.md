---
title: Self-returning fluent step contract
description: pub contract XxxStep with terminal method; generated facades Tier 2.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-FLUENT-0004
adrStatus: Accepted
adrDate: 2026-06-10
lastReviewed: 2026-06-10
---

## Context

Chainable APIs (ANSI builders, future collection facades) need a uniform contract shape that codegen and mods can target without ad hoc free-function `self` parameters.

## Decision

| Rule | Detail |
| --- | --- |
| Contract | `pub contract {Name}Step` declares chain methods returning `{Name}Step` |
| Terminal | At least one method **must** return a non-step type (`Into{Name}()`, `ApplyTo(...)`, `IntoSequence()`, etc.) |
| Authoring | Wrapper types carry **`[FluentStep]`** / **`[FluentInner]`** / **`[FluentChain]`** / **`[FluentTerminal]`** attributes (`Beskid.Fluent` in compiler SDK) |
| Generation | `Beskid.Fluent` mod **may** emit step contracts from annotated types via `Collector`/`Generator` and `Emitter`; **`Core.Fluent.Registry`** is deprecated |
| Stability | Generated fluent facades are **`@tier(supported)`** until host merge and target-driven materialization are automatic in CI |

## Consequences

- Collections and Query gain optional fluent wrappers without duplicating semantics on the underlying types.
- Console ANSI contracts remain the normative hand-written example; registry may include them later.
- Mod output may be checked in via **`generatedOutputs`** materialization until merge/reparse is proven in CI; no standalone `beskid mod generate` CLI.

## Verification anchors

- `compiler/corelib/packages/console/src/Ansi/Contracts.bd`
- `compiler/corelib/mods/corelib_fluent_gen/` (Phase 5)

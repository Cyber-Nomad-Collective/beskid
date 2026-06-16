---
title: Mod projects must not alter app composition
description: Compiler Mod type forbids host blocks on mod projects.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0010
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Compiler mods and app DI share syntax keywords but different planes.

## Decision

`Mod` projects **must not** declare app **`host`** blocks or alter app composition graphs. Mod registration uses contract **`registrations[]`** per [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/).

## Consequences

Clear boundary between [Pipeline composition](/platform-spec/compiler/pipeline-composition/) (Rust) and app DI (Beskid).

## Verification anchors

[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/); [Mod host bridge](/platform-spec/compiler/compiler-mods/mod-host-bridge/).

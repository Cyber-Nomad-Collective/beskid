---
title: Implementation domains defer to language-meta
description: Compiler, execution, core-library, and tooling realize language law
  without duplicating normative semantics.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-AUTH-0002
adrStatus: Accepted
adrDate: 2026-05-21
lastReviewed: 2026-05-22
---

## Context

Pipeline and host details were written as if they owned user-visible meaning, overlapping language-meta chapters.

## Decision

[Compiler](/platform-spec/compiler/), [Execution](/platform-spec/execution/), [Core library](/platform-spec/core-library/), and [Tooling](/platform-spec/tooling/) specify *how the reference platform realizes* language-meta. They **must not** redefine semantics already owned there; they **must** defer with `relatedTopics` (for example `defers-to`, `implements`) instead of duplicating normative key tables.

## Consequences

Classification happens before authoring: “what does valid code mean?” → language-meta first; crates and phases link back.

## Verification anchors

`relatedTopics` frontmatter validation in `verify:trudoc --preset ci`.

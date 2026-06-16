---
title: Language law lives only in language-meta
description: User-visible semantics are normative only under language-meta
  unless a documented cross-domain exception applies.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMM-AUTH-0001
adrStatus: Accepted
adrDate: 2026-05-21
lastReviewed: 2026-05-22
---

## Context

Platform-spec domains multiplied without a single place for “what valid Beskid code means,” inviting duplicate type and evaluation tables in compiler and tooling chapters.

## Decision

**Language law** — syntax, types, evaluation, contracts, memory, and cross-cutting language rules — **must** be defined only under [Language meta](/platform-spec/language-meta/), except where another domain page declares an explicit **cross-domain exception** and links to the owning language-meta chapter.

## Consequences

New language semantics start in language-meta; implementation domains link back instead of redefining tables.

## Verification anchors

`packages/trudoc/src/verify/platform-spec-content.ts`; `cd site/website && bun run verify:trudoc -- --preset ci`.

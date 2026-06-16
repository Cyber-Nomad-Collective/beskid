---
title: Embedded Pest grammars carve-out
description: Mod-local .pest files do not alter host Beskid surface parser.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-MODS-0020
adrStatus: Accepted
adrDate: 2026-06-08
lastReviewed: 2026-06-08
---

## Context

D-COMP-FRONT-0012 requires a single host `beskid.pest` surface. Corelib needs embedded DSL parsers (markup, regex).

## Decision

Project-local `.pest` files compiled by **GrammarGenerator** parse **text DSLs only**. They **must not** replace or extend `beskid.pest`. Conformance fixtures **must** prove host surface unchanged.

## Consequences

- Clear boundary: host parser vs embedded grammars.
- `beskid_pest_gen` is not an alternate Beskid front-end.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest` unchanged by mod rebuild
- `compiler/crates/beskid_tests/fixtures/mods/pest_gen_mod/`

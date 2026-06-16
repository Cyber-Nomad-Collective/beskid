---
title: Combinator runtime contracts
description: Backtracking, zero-width guards, input caps, and rule labels for
  generated parsers.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TEXT-0002
adrStatus: Accepted
adrDate: 2026-06-08
lastReviewed: 2026-06-08
---

## Context

Hand-rolled parsers (`Console.Format.Markdown`) and future Pest-generated parsers need one predictable combinator substrate.

## Decision

| ID | Rule |
| --- | --- |
| **D-CORE-TEXT-0002** | Backtracking **must** occur only at `Choice` boundaries; no unbounded memoization in v1. |
| **D-CORE-TEXT-0003** | `Many`/`Many1` on a zero-width parser **must** error at runtime or be rejected at codegen. |
| **D-CORE-TEXT-0004** | Regex and generated parsers **must** enforce a default 1 MiB input cap. |
| **D-CORE-TEXT-0005** | Generated parsers **must** attach Pest rule names to `ParseResult::Err`. |

## Consequences

- Simpler runtime than Packrat parsing.
- Grammar authors must avoid left recursion and zero-width loops (codegen **E18xx**).

## Verification anchors

- `compiler/corelib/packages/foundation/src/Core/Text/Parser.bd`
- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/text/`

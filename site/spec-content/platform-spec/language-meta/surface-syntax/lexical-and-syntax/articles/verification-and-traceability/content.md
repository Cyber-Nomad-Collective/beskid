---
title: Lexical and syntax - Verification and traceability
description: Tests, implementation checklist, and verification matrix for Beskid
  lexical and syntax.
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

## Verification matrix

| Scenario | Expected evidence |
| --- | --- |
| Identifier parsing | Matches `Identifier` production |
| Keyword rejection | Reserved keywords rejected as identifiers |
| String literal | Escapes and interpolation parsed correctly |
| Char literal | Single quote with escape parsed |
| Comment handling | `//`, `///`, `/* */` handled correctly |
| Empty program | Parses to empty `Program` |

## Implementation checklist

- [x] Grammar: `beskid.pest` with all lexical and syntactic productions
- [x] Parser: `parser.rs` driving pest
- [x] AST: all syntax nodes implement `Parsable`
- [x] Span attachment: every node carries `SpanInfo`
- [x] Doc attachment: `ItemWithDocs` wrappers
- [x] Diagnostics: **E1151–E1154** for early structural issues
- [ ] Incremental parsing optimization
- [ ] Parser error recovery for LSP

## Test locations

- `compiler/crates/beskid_analysis/src/beskid.pest` — grammar definition
- `compiler/crates/beskid_analysis/src/parser.rs` — parser tests
- `compiler/crates/beskid_analysis/src/syntax/` — AST node tests
- `compiler/crates/beskid_tests` — integration tests for parsing

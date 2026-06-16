---
title: Lexical and syntax - FAQ and troubleshooting
description: Common issues, troubleshooting, and locked decisions for Beskid
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

## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| Pest as grammar source | D-LM-LEX-001 | Checked-in pest file is single syntactic truth |
| `///` documentation | D-LM-LEX-002 | Triple-slash only; four+ slashes never doc |
| Reserved async/await | D-LM-LEX-003 | Tokens exist; semantic use forbidden |

## FAQ

### Can I use a keyword as an identifier?

No. Reserved keywords cannot be used as identifiers in v0.1.

### Does Beskid support raw string literals?

No. String literals use `"..."` with standard escapes only.

### What is the difference between `//` and `///`?

`//` is an ordinary comment. `///` is a documentation comment attached to the following item.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Parse error | Syntax does not match `beskid.pest` |
| Invalid identifier | Name spells a reserved keyword |
| Unclosed string | Missing closing `"` or `'` |
| Invalid escape | Unrecognized escape sequence |
| Doc not attached | `///` not immediately before item |

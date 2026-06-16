---
title: Examples
description: Examples for Core.Text.Regex.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-08
---

## Examples

```beskid
use Core.Text.Regex;
use Query.Contracts;

// Prefix match at position 0
Contracts.HasValue(Regex.Match("[a-z]+", "abc123")); // true → span 0..3

// Leftmost search
Contracts.HasValue(Regex.Find("[0-9]+", "x99y")); // true → span 1..3

// Non-overlapping enumeration
!Regex.IsFindAllEmpty(Regex.FindAll("[a-z]+", "a1bb2ccc"));
```

Implementation anchors: `compiler/corelib/packages/foundation/src/Core/Text/Regex.bd`, generated parsers in `Core/Text/Regex/Generated.bd` (regen via `regen_grammar_parsers.sh`).

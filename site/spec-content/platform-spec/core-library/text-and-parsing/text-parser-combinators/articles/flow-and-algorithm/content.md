---
title: Flow and algorithm
description: Execution flow for Core.Text.Parser.
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

## Algorithm

1. Construct `Cursor` from source.
2. Run combinator or generated parser.
3. Return `ParseResult`.

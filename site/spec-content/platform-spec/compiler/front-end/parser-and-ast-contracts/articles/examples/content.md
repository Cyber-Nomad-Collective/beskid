---
title: Examples
description: Concrete examples that show parser contracts in daily compiler work.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Example A: adding a new declaration form

1. Extend `beskid.pest` with the production.
2. Add/adjust syntax item parser in `src/syntax/items`.
3. Validate formatter behavior if the new node is printable.
4. Confirm resolver can discover names from the new declaration.

Example B: fixing a parser diagnostic

1. Reproduce failure in parser/analysis tests.
2. Adjust parse error mapping in `src/parsing`.
3. Ensure diagnostic code identity remains stable when routed through later phases.

---
title: Flow and algorithm
description: Step-by-step parse flow from source text to syntax structures.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

The parsing flow is intentionally linear:

1. Read source units from project services.
2. Execute grammar entry points from `beskid.pest`.
3. Convert parse tree fragments into syntax item/type nodes in `src/syntax`.
4. Emit parser diagnostics for malformed input and continue when recovery is defined.
5. Hand syntax trees to resolver (`src/resolve`) and semantic passes (`src/analysis`).

Algorithmically, the important invariant is determinism: identical source text must produce identical syntax node graphs and stable diagnostic ordering.

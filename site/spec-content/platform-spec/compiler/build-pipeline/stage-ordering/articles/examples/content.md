---
title: Stage ordering and lowering - Examples
description: Newcomer-oriented examples of pipeline execution order and failure points.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- **Successful run:** parse + rules + typing succeed; artifact is sent to JIT and executed.
- **Build with semantic error:** rules emit an error; lowering exits before object emission.
- **Parse failure:** parse stage emits diagnostics and no HIR or backend stages run.

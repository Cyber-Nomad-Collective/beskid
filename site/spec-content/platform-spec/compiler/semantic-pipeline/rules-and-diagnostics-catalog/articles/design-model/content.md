---
title: Design model
description: Mental model for staged semantic rules and diagnostic production.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Semantic analysis is modeled as a staged rule engine:

- Resolver prepares symbol and type context.
- Rule modules read that context and emit typed issues.
- Issue kinds map to stable code/category metadata.
- Service adapters project the same issue identity into CLI and LSP output models.

For newcomers, the key idea is separation of concerns: rule logic decides **what is wrong**, while diagnostics infrastructure decides **how it is labeled and surfaced**.

## Meta and meta-host diagnostics

Codes **E1801–E1899** are owned by manifest, workspace, mod host, emit merge, and mod contract validation—not by ordinary semantic rules. When adding mod-related failures, update **[Diagnostic code registry / design model](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)** first, then reference the new code from rule modules or manifest validators so the catalog remains single-sourced.

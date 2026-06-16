---
title: Design model
description: Conceptual model for `Test harnesses and fixtures` and its
  subsystem boundaries.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Harness layers

Conformance is split so failures localize quickly:

| Layer | Crate path | Pins |
| --- | --- | --- |
| **Analysis fixtures** | `beskid_tests/src/analysis` | Diagnostic codes, resolver graphs, staged rules |
| **Runtime JIT** | `beskid_tests/src/runtime` | Builtin dispatch, GC, fibers |
| **E2E sources** | `beskid_e2e_tests` | Full `.bd` programs through CLI backends |
| **Doc tests** | `beskid_tests/src/doc_tests.rs` | Spec snippets compile and match asserted output |

```mermaid
flowchart LR
  fixture[.bd / .json fixtures]
  analysis[analysis harness]
  runtime[runtime harness]
  e2e[e2e harness]
  fixture --> analysis
  fixture --> runtime
  fixture --> e2e
  analysis --> diag[Diagnostic snapshot]
  runtime --> jit[JIT smoke]
  e2e --> exit[Process exit + IO]
```

## Fixture conventions

- Prefer **minimal** `.bd` files per diagnostic or rule; share `Project.proj` layouts via `beskid_tests/src/projects` builders.
- Golden diagnostics **must** cite stable codes from [diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).
- Runtime tests **must** negotiate the same ABI version as production `beskid run`.

## Code anchors

- `compiler/crates/beskid_tests/src/analysis`
- `compiler/crates/beskid_tests/src/runtime`
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`
- `compiler/crates/beskid_tests/src/doc_tests.rs`

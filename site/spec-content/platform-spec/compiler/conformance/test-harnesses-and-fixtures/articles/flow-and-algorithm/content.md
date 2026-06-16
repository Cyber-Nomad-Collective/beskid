---
title: Flow and algorithm
description: End-to-end control flow and major algorithmic steps for `Test
  harnesses and fixtures`.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## End-to-end flow

1. Input enters compiler/runtime boundary at a stable entrypoint.
2. The responsible crate enforces the expected shape and emits stable structures.
3. Downstream crates consume those structures without redefining semantics.
4. Conformance tests assert behavior at integration boundaries.

## Algorithm notes for newcomers

- Prefer tracing one fixture end-to-end before reading all modules.
- Verify where shape conversion happens; avoid assuming all crates mutate data.
- Keep an eye on handoff points where diagnostics or ABI constraints are locked.

## Where to step through code

- Start with `compiler/crates/beskid_tests/src/analysis` for fixture-driven semantic assertions.
- Then inspect `compiler/crates/beskid_tests/src/runtime` for runtime behavior checks.
- Follow consumption at `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` for source-to-runtime outcomes.
- Validate expectations using `compiler/crates/beskid_tests/src/doc_tests.rs` for docs-driven verification.

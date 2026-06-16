---
title: FAQ and troubleshooting
description: Common questions and debugging guidance for `Test harnesses and fixtures`.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Why did a change pass locally but fail in CI?

Most often, one crate boundary changed but the corresponding fixture or downstream consumer was not updated. Re-run the nearest conformance suite and inspect cross-crate handoff points.

## Where should I start debugging?

1. Confirm the target requirement in this feature hub.
2. Step through `compiler/crates/beskid_tests/src/analysis` and `compiler/crates/beskid_tests/src/runtime`.
3. Validate consumer behavior at `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`.
4. Reproduce with `compiler/crates/beskid_tests/src/doc_tests.rs`.

## How do I add a new rule safely?

Document the new contract in the relevant article, update implementation in the owning crate, and add a fixture proving both happy-path and failure-path behavior.

---
title: FAQ and troubleshooting
description: Common questions and debugging guidance for `Lowering contract`.
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
2. Step through ``beskid_codegen::lower_source` in `compiler/crates/beskid_codegen`` and ``CodegenArtifact` construction in `compiler/crates/beskid_codegen``.
3. Validate consumer behavior at ``JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs``.
4. Reproduce with `Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs``.

## How do I add a new rule safely?

Document the new contract in the relevant article, update implementation in the owning crate, and add a fixture proving both happy-path and failure-path behavior.

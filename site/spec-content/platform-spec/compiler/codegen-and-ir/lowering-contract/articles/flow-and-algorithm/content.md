---
title: Flow and algorithm
description: End-to-end control flow and major algorithmic steps for `Lowering contract`.
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

- Start with ``beskid_codegen::lower_source` in `compiler/crates/beskid_codegen``.
- Then inspect ``CodegenArtifact` construction in `compiler/crates/beskid_codegen``.
- Follow consumption path at ``JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs``.
- Validate expectations using `Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs``.

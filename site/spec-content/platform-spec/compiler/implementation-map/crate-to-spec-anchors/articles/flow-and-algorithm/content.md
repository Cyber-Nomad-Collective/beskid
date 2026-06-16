---
title: Flow and algorithm
description: End-to-end control flow and major algorithmic steps for
  `Crate-to-spec anchors`.
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

- Start with ``beskid_analysis` -> parser/resolution/semantic leaves`.
- Then inspect ``beskid_codegen` -> lowering contract leaves`.
- Follow consumption path at ``beskid_abi` and `beskid_runtime` -> execution ABI/runtime leaves`.
- Validate expectations using ``beskid_tests` and `beskid_e2e_tests` -> conformance leaves`.

---
title: Conformance evidence policy - Examples
description: Gives concrete newcomer-friendly scenarios mapped to real compiler paths.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **examples** for **conformance evidence policy** in the reference compiler.

## What this covers
Concrete scenarios mapped to specific test fixtures and code paths in the compiler test crates.

## Example 1: Adding a new diagnostic and locking it

1. Define the diagnostic code in the [diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).
2. Emit it from the relevant `beskid_analysis` pass.
3. Add a `.bd` fixture under `beskid_tests/src/analysis/` that triggers the diagnostic.
4. Run the diagnostics test suite to record the new golden.
5. If the diagnostic applies to Mod projects, also add a fixture triggering it through the Mod pipeline in `beskid_tests/src/mods/`.

## Example 2: Verifying Mod pipeline ordering

The reference fixture at `compiler/crates/beskid_tests/fixtures/mods/sample_mod/Project.proj` exercises the full Mod pipeline. The test in `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs`:

- Loads the project via `mod.load`.
- Records every `PipelineObserver` phase callback.
- Asserts the canonical ordering: `load → collect → generate → analyze → rewrite`.
- Checks that lowering only fires after rewrite.

## Example 3: Regression-proofing incremental replay

`compiler/crates/beskid_tests/src/mods/incremental_replay.rs` performs repeated edits with identical keys and asserts stable generator outputs. To add a new replay case:

1. Choose an existing Mod fixture or create a minimal one.
2. Define a sequence of edit operations in the test.
3. Assert that after each edit-and-replay cycle, the generator output is byte-identical to the previous run.
4. If the output changes, the test fails — the change is intentional or the fix is needed.

## Anchored code paths
- `compiler/crates/beskid_tests/fixtures/mods/sample_mod/` — Reference Mod project fixture.
- `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` — Mod pipeline end-to-end dispatch.
- `compiler/crates/beskid_tests/src/mods/incremental_replay.rs` — Incremental replay assertions.
- `compiler/crates/beskid_tests/src/analysis/diagnostics.rs` — Semantic diagnostic golden tests.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.

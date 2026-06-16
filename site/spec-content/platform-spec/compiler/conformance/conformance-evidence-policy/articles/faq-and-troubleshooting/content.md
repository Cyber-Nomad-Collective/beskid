---
title: Conformance evidence policy - FAQ and troubleshooting
description: Answers common operator and contributor questions with practical next checks.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **faq and troubleshooting** for **conformance evidence policy** in the reference compiler.

## What this covers
Common questions and debugging guidance when conformance tests fail.

## FAQ

### Why did a diagnostic golden test fail after I changed an analysis pass?
Your change altered the diagnostic output. Check `compiler/crates/beskid_tests/src/analysis/diagnostics.rs`. If the new output is intentional, update the golden file (run with `BLESS=1` if supported). If the change regressed behavior, revert and add a dedicated fixture for the intended fix first.

### The PipelineObserver test reports a phase ordering violation. What does that mean?
The Mod pipeline phases fired in an order that violates the canonical sequence: `load → collect → generate → analyze → rewrite`. Check `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` for the expected order. Common causes: inserting a new phase step, reordering calls in `beskid_analysis::mod_host`, or silent phase skipping.

### How do I add a new conformance test for a Mod feature?
1. If you need to exercise the full Mod pipeline, extend or clone the reference fixture at `compiler/crates/beskid_tests/fixtures/mods/sample_mod/`.
2. Add a new test module under `compiler/crates/beskid_tests/src/mods/`.
3. Register the module in `mods/mod.rs`.
4. Assert diagnostic codes from the [diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Why are LSP diagnostics different from CLI diagnostics for the same input?
Check `compiler/crates/beskid_tests/src/spine/diagnostics_parity.rs`. The spine parity tests assert that Mod diagnostics round-trip through `beskid_lsp` with the same codes as CLI analysis. If they diverge, a code path in the LSP middleware or the spine is producing a different diagnostic than the CLI pipeline.

### My incremental replay test passes locally but fails on CI. Why?
Incremental replay in `compiler/crates/beskid_tests/src/mods/incremental_replay.rs` asserts byte-identical generator output. Differences between local and CI usually come from:
- Lockfile resolution producing different dependency hashes.
- Environment-specific paths leaking into generator output.
- Non-deterministic ordering in hash maps or parallel passes.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.

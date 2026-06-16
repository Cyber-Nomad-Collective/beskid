---
title: Reachability link plan
description: Production lowering must build FunctionDefIndex, LinkPlan, and
  validate_artifact before JIT or AOT.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-IR-0010
adrStatus: Accepted
adrDate: 2026-05-29
lastReviewed: 2026-05-29
---

## Context

Codegen lowered entry functions on demand from span tables, emitting callees that JIT link could not resolve. A reachability `LinkPlan` exists for tests but was not required for run/build entrypoints.

## Decision

Production lowering **must**:

1. Build `FunctionDefIndex` from `Resolution` and `assembly.hir_units` (all units in the assembly cache).
2. Construct `LinkPlan` for declared entry symbols (tests, `main`, qualified run/build entrypoints) including transitive callees and monomorphized instances.
3. Lower only symbols listed in the plan (no on-demand span-global fallback in release paths).
4. Run `beskid_codegen::validate_artifact` before `beskid_engine` / `beskid_aot` consume the artifact.

## Consequences

`lower_program_with_assembly` and linking modules own completeness. Undefined callees fail at validate time with deterministic diagnostics.

## Verification anchors

- `compiler/crates/beskid_codegen/src/linking/plan.rs`
- `compiler/crates/beskid_codegen/src/linking/def_index.rs`
- `compiler/crates/beskid_codegen/src/linking/validate.rs`
- `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`
- `compiler/crates/beskid_codegen/tests/array_tests_linking.rs`
- `compiler/crates/beskid_engine/src/engine.rs`

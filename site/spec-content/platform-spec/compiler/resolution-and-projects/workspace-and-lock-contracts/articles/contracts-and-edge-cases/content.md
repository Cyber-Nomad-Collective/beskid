---
title: Workspace and lock contracts - Contracts and edge cases
description: Compiler guarantees for lock-backed graphs and workspace layout invariants.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Compiler contracts

- **Deterministic graph** — Given the same lock snapshot and workspace layout, resolution produces the same member DAG.
- **Layout invariants** — Folder layout under workspace members must match what lock materialization expects; violations fail before semantic analysis.
- **No silent lock ignore** — When CI or `--locked` policy is active, missing or stale locks are errors, not warnings-only, unless tooling explicitly defines a warning mode for that command.

## Edge cases (resolution)

- **Stale lock vs registry** — Pin resolution failures surface at materialize time with stable diagnostics.
- **Partial member checkout** — Missing member directories fail graph build with layout-specific codes.
- **Cross-feature manifest errors** — Invalid `Project.proj` nodes still fail in the project-manifest resolution path first.

Workspace key forbiddances and reserved names are specified in **[tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/design-model/)** and are not duplicated here.

## Code anchors

- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`
- `compiler/crates/beskid_cli/src/commands/`

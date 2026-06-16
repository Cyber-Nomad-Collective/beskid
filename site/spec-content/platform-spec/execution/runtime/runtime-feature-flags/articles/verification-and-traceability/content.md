---
title: Verification and traceability
description: Cargo feature definitions, conditional compilation gates, and CI
  matrix expectations.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

## Source files

| Path | Content |
| --- | --- |
| `compiler/crates/beskid_runtime/Cargo.toml` | `[features]` table |
| `compiler/crates/beskid_runtime/src/builtins/arrays.rs` | `#[cfg(feature = "arrays_backing")]` |
| `compiler/crates/beskid_runtime/src/builtins/mod.rs` | `metrics` module gate |
| `compiler/crates/beskid_engine/Cargo.toml` | `extern_dlopen` feature |
| `compiler/crates/beskid_cli/src/commands/doc.rs` | Execution modes referencing runtime |

## Tests

| Suite | Notes |
| --- | --- |
| `beskid_tests/src/runtime/jit.rs` | Default runtime feature set |
| Engine `extern_*` tests | Require `extern_dlopen` |
| Future: explicit `arrays_backing` fixture | Assert `ptr != null` when enabled |

## Traceability

| ID | Check |
| --- | --- |
| **RFF-001** | ABI version constant unchanged in feature-only PRs |
| **RFF-003** | CI job definitions list `arrays_backing` where needed |
| **RFF-006** | Default engine feature set off in release workflow |

## Implementation anchors
- `compiler/crates/beskid_runtime/Cargo.toml` — default feature set verification
- `compiler/crates/beskid_runtime/src/builtins/arrays.rs` — `arrays_backing` conformance tests
- `compiler/crates/beskid_cli/src/commands/doc.rs` — shipped artifact feature documentation

## Related topics

- [Contracts and edge cases](./contracts-and-edge-cases/)
- [CLI area](/platform-spec/tooling/cli/)

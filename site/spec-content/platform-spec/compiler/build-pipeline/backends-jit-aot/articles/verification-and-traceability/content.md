---
title: Backends (JIT and AOT) - Verification and traceability
description: Crate-level anchors and tests that verify backend divergence and
  shared lowering contract.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Implementation anchors:

- `compiler/crates/beskid_engine/src/services.rs`
- `compiler/crates/beskid_engine/src/jit_module.rs`
- `compiler/crates/beskid_aot/src/api.rs`
- `compiler/crates/beskid_aot/src/linker.rs`
- `compiler/crates/beskid_cli/src/commands/build.rs`

Evidence should include JIT runtime tests in `compiler/crates/beskid_tests/src/runtime/` and AOT contract tests in `compiler/crates/beskid_tests/src/aot/`.

CI anchors:

- Compiler pipeline checks in `compiler/.github/workflows/ci.yml` (`test`, `e2e-*`, `extern-engine-security`).
- Superrepo runtime orchestration in `.github/workflows/runtime-ci.yml`.

import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

CLI/LSP divergence.

## Decision

Use beskid_analysis aligned with LSP.

## Consequences

- CLI compile commands (`run`, `build`, `test`, `clif`) and LSP share the same `beskid_analysis` prepare spine.
- Each compile command performs **one** executable prepare (`executable_gate_prepared` / `PrepareMode::Executable`) before lowering or codegen; a second prepare on the same command is forbidden.
- Lowering and codegen consume the prepared front-end bundle (`into_executable` → `lower_from_front_end`); they must not re-enter `prepare_compilation`.
- Parity: diagnostics, semantic snapshots, and typed HIR products match between CLI and LSP for the same resolved input.

## Verification anchors

- `compiler/crates/beskid_tests/src/spine/single_prepare.rs` — asserts one parent `semantic` and one parent `lower` per run-path prepare.
- Pipeline integration tests under `compiler/crates/beskid_tests/src/analysis/pipeline/`.

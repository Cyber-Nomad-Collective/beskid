# Agent A - Compiler ISLE Lowering Gaps

## Scope
Close all remaining ISLE lowering gaps that block the corelib gate and 0.4 release. Work in compiler/crates/beskid_isle/, compiler/crates/beskid_codegen/, compiler/crates/beskid_queries/, and compiler/corelib/.

## Issues (12)

| ID | Pri | Title | Dependencies |
|----|-----|-------|--------------|
| CYB-157 | Urgent | Specify and implement managed aggregate allocation ABI-v5 | - |
| CYB-158 | Urgent | Emit header-aware syntax aggregate layouts and static allocation plans | CYB-157 |
| CYB-159 | Urgent | Lower aggregate literals through managed allocation with root-safe stores | CYB-158 |
| CYB-156 | Urgent | Preserve valid string handles through ANSI style-chain JIT lowering | CYB-159 |
| CYB-138 | Urgent | Specialize generic string equality to ABI str_eq | CYB-156 |
| CYB-161 | Urgent | Import Core.Syscall and Core.Results for canonical Core.Error lowering | - |
| CYB-140 | Urgent | Generalize generic call ABI-specialization harvesting for reachable corelib helpers | - |
| CYB-162 | Urgent | Lower value-field projections on event-bearing nominal aggregates | CYB-140 |
| CYB-163 | Urgent | Align Ansi.PrivateMode with syntax mutable-local authority | - |
| CYB-141 | Urgent | Authorize canonical Foundation Output panic service lowering | - |
| CYB-173 | High | LambdaExpression ISLE lowering gap (W4.2 carry-over) | - |
| CYB-174 | Medium | CodeStringLiteral and TryExpression gaps | - |

## Serial Chain (must be done in order)
1. CYB-157: Define managed aggregate allocation ABI-v5 contract. Update normative OpenSpec ABI/runtime contract before changing observable behavior.
2. CYB-158: Change syntax aggregate layouts so field offsets begin after BeskidObjectHeader, matching the managed-object descriptor model.
3. CYB-159: Replace stack-backed aggregate-literal returns in generated ISLE with managed aggregate allocation. Change emit_struct_literal and associated aggregate field paths.
4. CYB-156: Fix StyleChain.New/StyleChain.AppendCode returning valid string handles through managed allocation.
5. CYB-138: Specialize Assert.Equal<string> / actual == expected to ABI str_eq instead of pointer identity.

## Parallel Tasks (independent, can run concurrently with the chain)
- CYB-161: Add use Core.Syscall and use Core.Results imports in Core/Error/Error.bd for qualified Core.Syscall.WriteWith resolution.
- CYB-140: Generalize harvest_specializations to cover all reachable corelib helpers, not just Results.IsOk/IsError.
- CYB-162: Lower value-field projections (progress_bar_clamps_percent) on event-bearing nominal aggregates through syntax ISLE.
- CYB-163: Fix Ansi.PrivateMode mutable-local authority - ansi_private_alt_screen test.
- CYB-141: Authorize __panic_str in Foundation Core.Output as CorelibService (same as Testing/Assert.bd).

## Lower Priority (can defer to post-0.4 if needed)
- CYB-173: Implement syntax to ISLE lowering for freestanding lambda values. Wire closure environment allocation. High priority but not blocking corelib gate.
- CYB-174: Add try to match desugaring pass in beskid_analysis. Document CodeStringLiteral as intentionally unsupported for 0.4. Medium priority.

## Verification
After each fix:
  cd compiler
  cargo test -p beskid_isle --all-targets
  cargo test -p beskid_codegen --all-targets
  cargo test -p beskid_queries --tests

After the full chain:
  CORELIB_REPORT_DIR=tmp bash scripts/ci/corelib-gate.sh

## Key Files
- compiler/crates/beskid_isle/src/lib.rs - ISLE rule inventory, emit_struct_literal, emit_spawn
- compiler/crates/beskid_isle/isle/*.isle - ISLE rule files (statements, control_flow, items)
- compiler/crates/beskid_codegen/src/lowering/ - function.rs, syntax module lowering
- compiler/crates/beskid_queries/src/semantic_contract.rs - semantic fact authority
- compiler/corelib/packages/foundation/src/ - Core.Output, Core.Error, Core.Syscall, Core.Results
- compiler/runtime/beskid/src/ - canonical runtime (allocation, GC, strings)
- compiler/runtime_manifest.bsol - ABI-v5 manifest (symbol allowlists)

## Acceptance
- Corelib gate passes all test targets (SystemOutputWriteTests, SystemErrorWriteTests, ConsoleAnsiEscapeTests, ConsoleControlsProgressBarTests)
- No MissingRuleOrFact errors in production lowering paths
- No UnsupportedTypedOperation for constructs used in corelib
- cargo test --workspace --all-targets green

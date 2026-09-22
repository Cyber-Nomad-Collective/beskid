# F4-V Provenance-Safe Timer Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` task-by-task. Every task is test-first and receives a fresh review before the next task starts.

**Goal:** Execute the private production Core.Time deadline and status validators through Engine JIT, static native, and shared native routes without changing their source provenance or duplicating their decisions.

**Architecture:** The test assembly retains the exact canonical Core.Time source and trusted path, selects public `Sleep` plus genuine validation syntax items by `AstNodeKey`, and proves `direct_callees(Sleep)` and `reachable_items(Sleep)` contain the exact helper identities before lowering their reachable closure. One focused C driver receives real emitted function pointers and query-derived layout metadata in every route; it constructs Duration through production `FromNanoseconds` and observes the actual Result values.

**Tech Stack:** Rust test harnesses, Salsa semantic facts, `CodegenInput`, `SyntaxModuleItem`, `lower_syntax_program`, Cranelift artifacts, C ABI v5, validated native runtime kits, OpenSpec.

**Spec:** `openspec/changes/beskid-v0-5-foundations/design.md` F4-V; `openspec/changes/beskid-v0-5-foundations/specs/core-library--stability-and-api-shape--core-time/spec.md` `BSP-REQ-8851DD840BC2` and `BSP-REQ-CB2C00464517`.

## Global Constraints

- Keep `Core.Time.Sleep` as the sole public timer API: no Core.IO path, public helper, timer handle, `SleepUntil`, alternate scheduler, or runtime override.
- Preserve both exact source bytes and canonical/trusted materialized source identity required by `canonical_corelib_service_units`.
- Lower only genuine production definitions and their reachable closure; no appended/spliced syntax, copied decision tree, hard-coded nominal layout offsets, or guessed C function signatures.
- The native driver contains invocation, rooting, and observation only; it never decides deadline validity or status mapping.
- A fatal-status test passes only when its child exits unsuccessfully and emits `Core.Time.Sleep observed an invalid runtime status`.
- F4-W remains open until the exact same tests execute nonzero cases on `x86_64-pc-windows-msvc`.

## Review Focus

- A copied Core.Time path or changed byte sequence must receive no privileged clock/panic service authority, and public `Sleep` must retain exact direct-call facts to the two selected helpers.
- Managed Duration and Result references must remain rooted over every call that can allocate.
- `Result<i64, TimerError>` and `Result<unit, TimerError>` must use their independently queried specialized layouts.
- A selected helper's emitted signature must be verified before the C driver casts its pointer.
- Link, loader, timeout, zero-case, or unrelated crash failures must never satisfy an impossible-status case.

### Task 1: Assemble and lower the exact production helper closure

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`
- Test: `compiler/crates/beskid_queries/src/typed_program.rs` authority regression already present; add an F4-V harness preflight assertion in `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`.

**Consumes:** canonical `Time.bd`, `build_typed_program_with_corelib_services`, `direct_callees`, `reachable_items`, `CodegenInput`, `SyntaxModuleItem`, `lower_syntax_program`.

**Produces:** one test-only `TimerValidationArtifact` that proves canonical `Sleep` directly reaches the selected helper keys and owns the lowered real `FromNanoseconds`, `SleepDeadlineFromSample`, and `SleepResultFromStatus` functions, their validated signatures, and their reachable closure.

- [ ] Write the failing F4-V preflight test that selects canonical `Sleep` plus the three genuine functions from canonical `Core.Time`, requires both private helpers in `direct_callees(Sleep)` and `reachable_items(Sleep)`, and rejects an altered source, copied source path, or alternate validation edge.
- [ ] Run `cargo test -p beskid_engine --test fiber_value_transfer source_timer_sleep_deadline_validation_uses_production_helpers -- --exact --nocapture`; expect selection/lowering support to be absent.
- [ ] Implement `TimerValidationArtifact` by preserving the source assembly unchanged, selecting the three original syntax keys, deduplicating their existing reachable items, lowering through `CodegenInput` and `lower_syntax_program`, and checking each emitted signature before any pointer conversion.
- [ ] Rerun the focused test; expect a real lowered artifact with production source authority only.
- [ ] Commit only the Rust selection/lowering slice after fresh review.

### Task 2: Add the one native observation driver

**Files:**
- Create: `compiler/crates/beskid_engine/tests/fixtures/timer_validation.c`
- Modify: `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`
- Test: `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`

**Consumes:** Task 1's genuine emitted function pointers, `syntax_item_signature`, specialized enum-layout facts, and `beskid_runtime_abi_v5.h` root APIs.

**Produces:** one callback driver shared by JIT, static, and shared paths; it calls production `FromNanoseconds`, then the selected helper, and observes query-described Result values.

- [ ] Write failing boundary assertions for `now = -1`, `17 + (I64_MAX - 17)`, `17 + (I64_MAX - 16)`, `I64_MAX + 0`, and `I64_MAX + 1`, plus status `0`, `3`, and `4`.
- [ ] Build the C driver around a single metadata structure containing ABI widths, real function addresses, and query-derived tag/payload locations; root Duration and Result references while invoking managed code.
- [ ] Wire Engine `entrypoint_ptr` addresses and selectively exported static/shared symbols into the same driver, following `external_wait_native.rs` rather than writing route-specific assertions.
- [ ] Run the named nonfatal test through all three routes; expect every boundary/status observation to pass and no long timer wait.
- [ ] Commit the C driver and route wiring after fresh review.

### Task 3: Prove fatal status handling and preserve platform closure

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`
- Modify: `compiler/crates/beskid_engine/tests/fixtures/timer_validation.c`
- Modify: `openspec/changes/beskid-v0-5-foundations/design.md` only if actual harness facts differ from this plan
- Test: `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`

**Consumes:** Task 2's native driver and all three route launchers.

**Produces:** isolated child cases for statuses `1`, `2`, `5`, and target-maximum `word`, with exact diagnostic and failed-exit checks in JIT, static, and shared execution. The existing native driver may gain only the fatal-case selector/invocation needed to call the real selected status helper; it must not duplicate status validation or return from the invariant path.

- [ ] Write failing child-process assertions requiring a route/case marker, failed exit, and the exact invariant diagnostic for each impossible status.
- [ ] Implement only the child selection and parent validation protocol; do not convert panic to a normal Result or accept generic process failure.
- [ ] Run both required F4-V commands and the full `fiber_value_transfer` harness; record per-route case counts, target, and runtime-kit identity.
- [ ] Run `pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive` and `git diff --check`; then request independent review.
- [ ] Add a Keep-a-Changelog entry with the actual executed routes and explicitly leave F4-R, F4-W, and F7 open; commit only after the reviewer accepts the evidence.

## Execution Handoff

The user explicitly selected subagent-driven execution. Start Task 1 in an isolated compiler worktree, then use a fresh independent reviewer before Task 2 and Task 3. Do not begin F4-W portability changes until the three-route macOS/Linux proof exposes the concrete shared harness boundary.

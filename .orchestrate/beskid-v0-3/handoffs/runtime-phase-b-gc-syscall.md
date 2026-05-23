# Handoff: `runtime-phase-b-gc-syscall`

- **Subplanner**: A5
- **Branches**:
  - Superrepo: `orch/beskid-v0-3/runtime-phase-b-gc-syscall` (from `main`)
  - Compiler submodule: `orch/beskid-v0-3/runtime-phase-b-gc-syscall` @ `1a85cee92d82e0e0ff9515175a6929d3b3bb388a`
- **Status**: Done — Phase B GC wired behind an opt-in flag with stress coverage.

## What landed

Implementation in `compiler` (single commit `1a85cee`):

- `crates/beskid_runtime/src/gc.rs`
  - `RuntimePhase` enum (`PhaseA` default, `PhaseB`) + `RUNTIME_PHASE` `AtomicU8`, env override `BESKID_RUNTIME_PHASE_B=1`, `set_runtime_phase` / `runtime_phase`.
  - `IS_SYSCALL_POOL_WORKER` thread-local + `set_syscall_pool_worker` / `is_syscall_pool_worker`.
  - `assert_mutator_allowed` panics when a syscall-pool thread reaches `with_current_root`/`with_current_root_if_active` without an active runtime scope (Phase B safety guard; degenerates to a debug-only check in Phase A).
  - `attach_phase_b_mutator(heap, ctx) -> MutatorAttachGuard` lets a foreign OS thread share an existing `Heap`/`GcContext` with the spawning thread; the guard restores the previous TLS on drop.
  - `RUNTIME_PREEMPT_ENABLED` `AtomicBool`, `set_preemption_enabled`, env override `BESKID_RUNTIME_PREEMPT=1`, and `runtime_preempt_check()` that yields the current fiber (or `thread::yield_now` if off-scheduler) only when preemption is enabled.
  - `init_phase_from_env_once` runs lazily and reads both env vars on first GC use.

- `crates/beskid_runtime/src/channel.rs` + `src/builtins/channel.rs`
  - New ABI surface: `channel_send_ptr`, `channel_try_send_ptr`, `channel_receive_ptr`, `channel_try_receive_ptr` (and `#[unsafe(no_mangle)]` C ABI wrappers).
  - Sender registers `value_ptr` as an external GC handle through `gc::store_handle`, pushes the handle as the channel's `i64` payload, applies `Heap::write_barrier` so the pointer is grayed during concurrent mark, and drops the handle on any error path.
  - Receiver dequeues the handle, resolves it via `ExternalRootSet::get_handle`, drops the registration, applies the receiver-side barrier, and writes the original `*mut u8` into `out_ptr`.
  - When called from an **OS thread that is not a Beskid fiber** (a Phase B mutator registered via `attach_phase_b_mutator`), back-pressure on a bounded queue falls back to `try_send`/`try_receive` polling with `std::thread::yield_now`. Calling the standard fiber `park_current` from that context panics; the new path is the only correct one.
  - Returns `STATUS_CLOSED` when no active mutator is registered to avoid leaking external handles.

- `crates/abfall/src/roots.rs`
  - `ExternalRootSet::get_handle(handle: u64) -> Option<*mut u8>` so the channel receiver can recover the pointer.

- `crates/beskid_abi/src/{symbols,builtins}.rs`
  - Symbol constants: `SYM_CHANNEL_SEND_PTR`, `SYM_CHANNEL_TRY_SEND_PTR`, `SYM_CHANNEL_RECEIVE_PTR`, `SYM_CHANNEL_TRY_RECEIVE_PTR`, `SYM_RUNTIME_PREEMPT_CHECK` added to `RUNTIME_EXPORT_SYMBOLS`.
  - `BuiltinFnSpec` entries with correct `I64_PTR` / `I64` / `Void` classification so AOT and JIT codegen can import the new builtins without further wiring.

- `crates/beskid_runtime/src/scheduler/syscall_pool.rs`
  - Each pool worker calls `set_syscall_pool_worker()` at thread start so the new mutator guard refuses stray allocations from syscall threads.

- `crates/beskid_runtime/src/lib.rs`
  - Re-exports the new GC/channel surface so downstream crates (`beskid_engine`, tests) can drive Phase B from one entry point.

- `crates/beskid_runtime/CONCURRENCY_STATUS.md`
  - Added milestone row **M9 (Phase B GC)**, a dedicated "Phase B GC (opt-in)" section listing the four invariants, and refreshed the gap list (removed the "Phase B not enabled" line; added "Phase B as default" and "Preemption code emission" as still-pending).

Stress coverage (`crates/beskid_runtime/tests/phase_b_concurrency.rs`, 8 tests):

| Test | What it proves |
| --- | --- |
| `phase_b_enables_via_setter` | `set_runtime_phase` flips `runtime_phase()` and survives the test's scoped reset. |
| `preemption_check_is_noop_when_disabled` | Default `runtime_preempt_check` is a no-op (no fiber needed). |
| `preemption_check_yields_when_enabled_off_fiber` | With preemption enabled and no fiber context, the hook falls back to `thread::yield_now` rather than panicking. |
| `syscall_pool_worker_without_scope_blocks_alloc` | A thread tagged with `set_syscall_pool_worker()` panics in `assert_mutator_allowed` when allocating without entering a runtime scope. |
| `syscall_pool_worker_with_runtime_scope_can_allocate` | Same thread can still allocate after explicitly opening a runtime scope (e.g. via `attach_phase_b_mutator`). |
| `pointer_channel_round_trip_applies_write_barrier` | Single-mutator pointer-payload send/receive preserves the pointer; the external-handle round-trip works; barrier path is hit. |
| `pointer_channel_cross_thread_with_phase_b_mutators` | Two threads sharing one heap via `attach_phase_b_mutator` exchange pointer payloads over a bounded channel without panics or leaks. |
| `phase_b_stress_many_mutators_concurrent_allocations` | Multi-producer, multi-consumer pointer-channel workload with concurrent allocations on a shared heap. |

Spec updates (`site/website/src/content/docs/platform-spec/`):

- `execution/runtime/memory-and-gc-runtime-contract/contracts-and-edge-cases.mdx`
  - New normative rows **GC-007** (Phase B mutator attach), **GC-008** (syscall-pool non-mutator), **GC-009** (pointer-channel write barrier + external handle), **GC-010** (preemption no-op when disabled). New rows in GC export contracts and edge-cases tables for `channel_*_ptr`, `runtime_preempt_check`, multi-mutator and syscall-guard cases.
- `execution/runtime/runtime-feature-flags/contracts-and-edge-cases.mdx`
  - **RFF-007** (Phase B opt-in for v0.3) and **RFF-008** (preemption disabled by default); feature behavior table extended with both flags.
- `execution/runtime/channels-and-synchronization/contracts-and-edge-cases.mdx`
  - New "Pointer-payload channels (Phase B)" section documenting the four `channel_*_ptr` builtins, external-handle registration, barriers on both sides, closed-channel behavior, and the OS-thread polling fallback.
- `execution/runtime/fiber-scheduler-and-stacks/adr/0003-phase-a-single-mutator.mdx`
  - Decision table updated to make Phase A the **default** and Phase B the **opt-in** state for v0.3, plus a "Future" row describing when Phase B becomes default. Verification anchors expanded to reference the new test file.
- `execution/runtime/memory-and-gc-runtime-contract/adr/0005-phase-a-before-phase-b.mdx`
  - "Ship order" table now lists Phase A, Phase B (opt-in v0.3, behind `BESKID_RUNTIME_PHASE_B` / `set_runtime_phase`), and Phase B (later default). Verification anchors now enumerate the existing GC tests plus the new Phase B stress file.
- `execution/runtime/panic-io-and-syscalls/adr/0010-blocking-syscalls-park-fiber.mdx`
  - Added a "Pool worker tagging" row that documents `set_syscall_pool_worker()` and the runtime trap on stray allocations.

## Verification

Run from `/private/tmp/compiler-phase-b` (compiler worktree on the Phase B branch) — same as a clean `compiler/` checkout of `1a85cee`:

```bash
cargo test -p beskid_runtime \
  --test concurrency --test gc_concurrency --test gc --test phase_b_concurrency \
  -- --test-threads=1
# 28 tests pass: 13 concurrency + 2 gc_concurrency + 5 gc + 8 phase_b_concurrency

cargo test -p beskid_tests runtime::sched
# 2 tests pass (fiber_yield_without_scheduler_is_callable, fiber_now_millis_is_monotonic)
```

Trudoc CI (`bun run verify:trudoc -- --preset ci` in `site/website/`) currently exits 1, but **only** on pre-existing failures owned by other in-flight tasks on the user's working tree:

- `platform-spec/core-library/stability-and-api-shape/corelib-api-shape` — missing required specSection (pre-existing modification, not from this task).
- `platform-spec/tooling/formatter/index.mdx` — backtick-prefixed YAML scalar (pre-existing, untracked file from another agent).

The runtime spec files I touched parse cleanly (verified via `yaml.parse` on each frontmatter block) and the platform-spec frontmatter validator (`bun run verify:platform-spec`) exits 0. None of the trudoc failures reference my edits.

## Suggested next steps for downstream tasks

- **Codegen prologues**: emit `runtime_preempt_check` at function entry once compiler-side preemption insertion is owned by a follow-up task. The symbol is already in `RUNTIME_EXPORT_SYMBOLS` and the builtin spec is registered.
- **Default Phase B**: flip the default in `RUNTIME_PHASE` to `PhaseB as u8` and remove the env override once the preemption emission lands and a longer-duration mark-stress workload is wired into CI.
- **Generic channel payloads at codegen**: corelib `Channel<T>` lowering for non-`i64` payloads should select between `channel_send` / `channel_send_ptr` based on whether `T` is a GC reference.
- **Phase B documentation in corelib normative pages**: the core-library concurrency tree still describes Phase A as the only mode for v0.2. Once Phase B is the default, refresh those pages mirroring this handoff.

## Outputs

- **Branch (superrepo)**: `orch/beskid-v0-3/runtime-phase-b-gc-syscall` from `origin/main`
- **Branch (compiler)**: `orch/beskid-v0-3/runtime-phase-b-gc-syscall` @ `1a85cee92d82e0e0ff9515175a6929d3b3bb388a` (pushed to `origin`)
- **Tests**: 28 runtime concurrency tests pass (`cargo test -p beskid_runtime --test concurrency --test gc_concurrency --test gc --test phase_b_concurrency`) + 2 `beskid_tests runtime::sched` tests.
- **Handoff**: `.orchestrate/beskid-v0-3/handoffs/runtime-phase-b-gc-syscall.md` (this file).
